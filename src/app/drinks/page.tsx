import { getStore } from "@/lib/store";
import { DrinksMenu } from "@/components/DrinksMenu";
import Link from "next/link";

export default async function DrinksPage() {
  const store = await getStore();
  const menu = store.menu.filter((item) => item.available !== false);

  return (
    <main className="min-h-screen bg-black text-white px-4 py-12 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
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

        <DrinksMenu items={menu} />
      </div>
    </main>
  );
}
