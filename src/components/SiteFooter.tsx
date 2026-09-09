import Image from "next/image";
import Link from "next/link";
import { CAFE } from "@/lib/cafe";
import { SocialLinks } from "@/components/SocialLinks";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-black px-5 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 lg:flex-row lg:items-start lg:gap-16">
        <div className="lg:w-52 lg:shrink-0">
          <Link href="/" className="inline-block">
            <Image
              src="/images/logo.jpg"
              alt={CAFE.name}
              width={160}
              height={160}
              className="h-14 w-14 rounded-full object-cover sm:h-16 sm:w-16"
            />
          </Link>
          <p className="mt-5 text-xl font-bold tracking-tight">{CAFE.name}</p>
          <p className="mt-4 text-[10px] tracking-[0.18em] text-neutral-500 uppercase sm:tracking-[0.28em]">
            {CAFE.tagline}
          </p>
        </div>

        <div className="grid flex-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div>
            <p className="text-[11px] tracking-[0.28em] text-neutral-500 uppercase">
              Visit
            </p>
            <a
              href={CAFE.mapsHref}
              target="_blank"
              rel="noreferrer"
              className="mt-4 block text-sm leading-6 text-neutral-300 hover:text-white"
            >
              {CAFE.street}
              <br />
              {CAFE.city}
            </a>
          </div>

          <div>
            <p className="text-[11px] tracking-[0.28em] text-neutral-500 uppercase">
              Hours
            </p>
            <p className="mt-4 text-sm leading-6 text-neutral-300">
              {CAFE.hours}
              <br />
              {CAFE.hoursNote}
            </p>
          </div>

          <div>
            <p className="text-[11px] tracking-[0.28em] text-neutral-500 uppercase">
              Connect
            </p>
            <div className="mt-4 space-y-2 text-sm break-words text-neutral-300">
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
            </div>
          </div>

          <div>
            <p className="text-[11px] tracking-[0.28em] text-neutral-500 uppercase">
              Follow
            </p>
            <div className="mt-4 flex items-center gap-3">
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
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 flex max-w-6xl flex-col gap-3 border-t border-white/10 pt-6 text-[10px] tracking-[0.14em] text-neutral-600 uppercase sm:mt-14 sm:flex-row sm:items-center sm:justify-between sm:tracking-[0.18em]">
        <p>© {new Date().getFullYear()} commune. Tetuan, Zamboanga City</p>
        <p>have a seat, take a sip</p>
      </div>
    </footer>
  );
}