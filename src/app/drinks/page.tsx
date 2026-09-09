import { getStore } from "@/lib/store";
import { formatMoney } from "@/lib/menu";
import type { MenuItem } from "@/lib/types";
import Link from "next/link";

export default async function DrinksPage() {
  const store = await getStore();
  const menu = store.menu.filter((item) => item.available !== false);

  // I-group ang mga items ayon sa category
  const groupedMenu = menu.reduce((acc, item) => {
    const category = item.category || "Other";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  return (
    <main className="min-h-screen bg-black text-white px-4 py-12 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 flex items-center justify-between border-b border-white/10 pb-6">
          <div>
            <p className="font-script text-2xl text-neutral-400">have a seat, take a sip</p>
            <h1 className="font-serif text-3xl italic sm:text-5xl mt-1">Commune Drinks</h1>
          </div>
          <Link
            href="/#menu"
            className="rounded-full border border-white/25 px-5 py-2.5 text-xs uppercase tracking-[0.18em] transition hover:bg-white hover:text-black"
          >
            Back to Home
          </Link>
        </div>

        <div className="space-y-16">
          {Object.entries(groupedMenu).map(([category, items]) => (
            <div key={category}>
              {/* Category Header */}
              <div className="mb-6 flex items-center gap-4">
                <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-400">
                  {category}
                </h2>
                <div className="h-[1px] flex-1 bg-white/10" />
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-neutral-900/50 p-5 transition duration-300 hover:border-white/30 hover:bg-neutral-900"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-medium tracking-wide text-white text-base">
                          {item.name}
                        </h3>
                      </div>
                    </div>
                    
                    <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
                      <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                        Available
                      </span>
                      <span className="font-semibold text-neutral-200">
                        {formatMoney(item.price)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}