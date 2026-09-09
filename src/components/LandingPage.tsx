import Image from "next/image";
import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { SocialLinks } from "@/components/SocialLinks";
import { CAFE } from "@/lib/cafe";
import { DEFAULT_MENU, formatMoney } from "@/lib/menu";
import type { MenuItem, Session } from "@/lib/types";

function Eyebrow({ children }: { children: string }) {
  return (
    <p className="px-2 text-[10px] tracking-[0.22em] text-neutral-500 uppercase sm:text-[11px] sm:tracking-[0.42em]">
      {children}
    </p>
  );
}

function Photo({
  src,
  alt,
  className,
  sizes,
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes: string;
  priority?: boolean;
}) {
  return (
    <article className={`group relative overflow-hidden bg-neutral-900 ${className ?? ""}`}>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className="object-cover transition duration-700 ease-out group-hover:scale-[1.04]"
      />
    </article>
  );
}

export function LandingPage({
  session,
  menu = DEFAULT_MENU,
}: {
  session: Session | null;
  menu?: MenuItem[];
}) {
  const bestSellers = menu
    .filter((item) => item.available !== false)
    .slice(0, 5);

  return (
    <div className="bg-black text-white">
      <section className="relative min-h-svh overflow-hidden">
        <Image
          src="/images/hero-wide.jpg"
          alt="commune cafe bar"
          fill
          priority
          quality={95}
          unoptimized
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/70" />
        <SiteNav session={session} />
        <div className="relative z-10 flex min-h-svh flex-col items-center justify-end px-5 pb-10 text-center sm:px-6 sm:pb-16">
          <p className="font-script text-2xl text-white/90 sm:text-4xl">
            have a seat, take a sip
          </p>
          <h1 className="font-display mt-3 max-w-5xl text-[2.7rem] leading-[0.9] tracking-[0.08em] text-white uppercase drop-shadow-[0_10px_30px_rgba(0,0,0,0.65)] sm:mt-5 sm:text-7xl sm:tracking-[0.12em] md:text-8xl">
            We commune,
            <br />
            over coffee
          </h1>
          <div className="mt-5 sm:mt-7">
            <p className="text-[10px] tracking-[0.28em] text-white/55 uppercase">
              Open Hours
            </p>
            <p className="mt-1.5 text-[11px] tracking-[0.22em] text-white/90 uppercase sm:text-sm sm:tracking-[0.28em]">
              {CAFE.hours} · {CAFE.hoursNote}
            </p>
          </div>
          <p className="mt-2 text-[10px] tracking-[0.22em] text-white/65 uppercase sm:text-[11px] sm:tracking-[0.38em]">
            Tetuan · Zamboanga City
          </p>
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#0b0b0b] px-3 py-10 sm:px-6 sm:py-24">
        <div className="mx-auto grid max-w-6xl items-stretch gap-3 sm:gap-4 md:grid-cols-12">
          <article className="relative min-h-[280px] overflow-hidden bg-black sm:min-h-[420px] md:col-span-7 md:min-h-[640px]">
            <Image
              src="/images/open.jpg"
              alt={`${CAFE.name} open ${CAFE.hours}`}
              fill
              sizes="(max-width: 768px) 100vw, 58vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
            <div className="absolute bottom-0 left-0 p-5 sm:p-10">
              <p className="font-serif text-5xl italic tracking-tight sm:text-8xl">
                OPEN!
              </p>
              <p className="mt-2 text-[10px] tracking-[0.12em] text-white/80 uppercase sm:mt-3 sm:text-sm sm:tracking-[0.28em]">
                {CAFE.hours} · {CAFE.hoursNote}
              </p>
            </div>
          </article>
          <Photo
            src="/images/drinks.jpg"
            alt="Signature iced drinks at commune"
            className="min-h-[240px] sm:min-h-[360px] md:col-span-5 md:min-h-[640px]"
            sizes="(max-width: 768px) 100vw, 42vw"
          />
        </div>
      </section>

      <section className="px-3 py-12 sm:px-6 sm:py-28">
        <div className="mx-auto mb-8 max-w-6xl px-2 text-center sm:mb-12">
          <p className="font-script text-3xl sm:text-5xl">have a seat, take a sip</p>
          <Eyebrow>{CAFE.tagline}</Eyebrow>
        </div>
        <div className="mx-auto grid max-w-6xl gap-3 sm:gap-4 md:grid-cols-2">
          <Photo
            src="/images/cups.jpg"
            alt="Iced latte and matcha at commune"
            className="min-h-[260px] sm:min-h-[440px] md:min-h-[520px]"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <Photo
            src="/images/"
            alt="Sea salt cream, Spanish latte, and brownie"
            className="min-h-[260px] sm:min-h-[440px] md:min-h-[520px]"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <Photo
            src="/images/matcha-umami.jpg"
            alt="New in the menu: Matcha Umami"
            className="min-h-[300px] sm:min-h-[520px]"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <Photo
            src="/images/carrier.jpg"
            alt="Have a seat, take a sip"
            className="min-h-[300px] sm:min-h-[520px]"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      </section>

      <section
        id="menu"
        className="border-y border-white/10 bg-[#111] px-4 py-12 sm:px-6 sm:py-28"
      >
        <div className="mx-auto grid max-w-6xl items-start gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <Eyebrow>Best Sellers</Eyebrow>
            <h2 className="mt-4 font-serif text-4xl italic sm:text-5xl">
              We commune, over coffee
            </h2>
            <p className="mt-4 max-w-md text-neutral-400">
              Signatures from the bar: iced, crumbled, and pulled to share.
            </p>

            <ul className="mt-8 divide-y divide-white/10">
              {bestSellers.map((item) => (
                <li
                  key={item.id}
                  className="flex items-baseline justify-between gap-3 py-4 sm:gap-6"
                >
                  <div>
                    <p className="font-medium tracking-wide text-white">{item.name}</p>
                  </div>
                  <p className="shrink-0 font-medium text-neutral-300">
                    {formatMoney(item.price)}
                  </p>
                </li>
              ))}
            </ul>

          <div className="mt-8 flex flex-wrap items-center gap-4">
  <Link
    href="/drinks"
    className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.22em] text-black transition hover:bg-neutral-200"
  >
    View Commune Drinks
  </Link>
  <a
    href="https://taximaxim.onelink.me/KKXl?pid=refferalmztall&af_dp=maximzakaz%3A%2F%2F&af_web_dp=https%3A%2F%2Ftaximaxim.com%2Fapp&c=menumzt"
    target="_blank"
    rel="noreferrer"
    className="inline-flex items-center justify-center rounded-full border border-white/25 px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-white hover:text-black"
  >
    Get your drink on Maxim!
  </a>
</div>
            
          </div>
          <Photo
            src="/images/menu-carrier.jpg"
            alt="Biscoff latte, caramel macchiato, Spanish latte, sea salt cream"
            className="min-h-[280px] sm:min-h-[520px] lg:min-h-[680px]"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>
      </section>

      <section id="about" className="px-4 py-12 sm:px-6 sm:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <Photo
            src="/images/storefront.jpg"
            alt="commune cafe storefront at night"
            className="min-h-[280px] sm:min-h-[480px] lg:min-h-[620px]"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          <div className="max-w-lg lg:pl-6">
            <Eyebrow>About Us</Eyebrow>
            <Image
              src="/images/logo.jpg"
              alt={CAFE.name}
              width={200}
              height={200}
              className="mt-8 h-20 w-20 rounded-full object-cover"
            />
            <h2 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">{CAFE.name}</h2>
            <p className="mt-3 text-[10px] tracking-[0.18em] text-neutral-500 uppercase sm:text-[11px] sm:tracking-[0.32em]">
              {CAFE.tagline}
            </p>
            <p className="mt-8 text-base leading-7 text-neutral-300 sm:text-lg sm:leading-8">
              Every cup tells a story, and every sip brings us closer together. A
              quiet industrial house in Tetuan. Matcha umami, sea salt cream,
              panini, and a table meant to be shared.
            </p>
          </div>
        </div>
      </section>

      <section
        id="contact"
        className="border-t border-white/10 bg-[#0b0b0b] px-3 py-12 sm:px-6 sm:py-28"
      >
        <div className="mx-auto mb-8 max-w-6xl px-2 text-center sm:mb-12">
          <Eyebrow>Contact Us</Eyebrow>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-4xl">
            Where to find us?
          </h2>
        </div>
        <div className="mx-auto grid max-w-6xl gap-3 sm:gap-4 lg:grid-cols-12">
          <div className="flex flex-col justify-between border border-white/10 bg-black/40 px-5 py-8 sm:px-8 sm:py-10 lg:col-span-5">
            <div>
              <p className="text-[11px] tracking-[0.28em] text-neutral-500 uppercase">
                Visit
              </p>
              <a
                href={CAFE.mapsHref}
                target="_blank"
                rel="noreferrer"
                className="mt-6 block text-lg leading-relaxed text-white transition hover:text-neutral-300 sm:text-xl"
              >
                {CAFE.street}
                <span className="mt-2 block text-base text-neutral-400">
                  ({CAFE.landmark})
                </span>
                <span className="mt-2 block text-base text-neutral-300">
                  {CAFE.city}
                </span>
              </a>
            </div>
            <div className="mt-12 space-y-3 text-sm text-neutral-300">
              <p className="text-[10px] tracking-[0.12em] uppercase sm:tracking-[0.18em]">
                {CAFE.hours} · {CAFE.hoursNote}
              </p>
              <p>
                <a href={CAFE.phoneHref} className="hover:text-white">
                  {CAFE.phone}
                </a>
              </p>
              <p>
                <a href={CAFE.emailHref} className="hover:text-white">
                  {CAFE.email}
                </a>
              </p>
              <div className="pt-4">
                <p className="text-[10px] tracking-[0.28em] text-neutral-500 uppercase">
                  Follow
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <SocialLinks />
                  <a
                    href="https://www.instagram.com/commune180?stkn=MXB6eWoyb2toajl1bA=="
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white transition hover:bg-white hover:text-black"
                    aria-label="Instagram"
                  >
                    <svg className="h-4 w-4 fill-current text-white hover:text-black" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                  <a
                    href="https://www.tiktok.com/@commune.caf?_r=1&_t=ZS-99aWUO2F5ur"
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white transition hover:bg-white hover:text-black"
                    aria-label="TikTok"
                  >
                    <svg className="h-4 w-4 fill-current text-white hover:text-black" viewBox="0 0 24 24">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.68a6.34 6.34 0 0 0 10.86 4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.14z"/>
                    </svg>

                  </a>git switch -c Rayhan
                  
                </div>
              </div>
            </div>
          </div>
          <Photo
            src="/images/open-now.jpg"
            alt="We're open now at commune"
            className="min-h-[220px] sm:min-h-[360px] lg:col-span-4 lg:min-h-[560px]"
            sizes="(max-width: 1024px) 100vw, 33vw"
          />
          <Photo
            src="/images/collage.jpg"
            alt="commune cafe moments"
            className="min-h-[220px] sm:min-h-[360px] lg:col-span-3 lg:min-h-[560px]"
            sizes="(max-width: 1024px) 100vw, 25vw"
          />
        </div>
      </section>

      <section className="border-t border-white/10 bg-black">
        <div className="mx-auto flex max-w-6xl items-end justify-between gap-4 px-5 py-6 sm:px-6 sm:py-8">
          <div>
            <p className="text-[11px] tracking-[0.28em] text-neutral-500 uppercase">
              Find us
            </p>
            <p className="mt-2 text-sm text-neutral-300">
              {CAFE.street}, {CAFE.city}
            </p>
          </div>
          <a
            href={CAFE.mapsHref}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 rounded-full border border-white/25 px-4 py-2 text-[10px] tracking-[0.18em] text-white uppercase transition hover:bg-white hover:text-black"
          >
            Open in Maps
          </a>
        </div>
        <div className="relative h-[260px] overflow-hidden border-t border-white/10 sm:h-[380px] lg:h-[460px]">
          <iframe
            title="Commune Cafe on Google Maps"
            src={CAFE.mapsEmbed}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0 h-full w-full border-0 grayscale contrast-125"
          />
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}