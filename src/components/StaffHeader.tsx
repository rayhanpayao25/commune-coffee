"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { logout } from "@/actions/auth";
import type { Session } from "@/lib/types";

export type AdminSection = "admin" | "staff";

type StaffHeaderProps = {
  session: Session;
  section: AdminSection;
  onSectionChange: (section: AdminSection) => void;
};

export function StaffHeader({ session, section, onSectionChange }: StaffHeaderProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 bg-white px-4 py-4 sm:px-6 sm:py-5">
      <div className="flex items-center gap-4 sm:gap-6">
        <BrandLogo size="sm" align="start" />
        <nav className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 p-1">
          {(
            [
              ["admin", "Admin"],
              ["staff", "Staff"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => onSectionChange(id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition sm:px-5 ${
                section === id
                  ? "bg-black text-white shadow-sm"
                  : "text-neutral-600 hover:bg-white hover:text-black"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <div className="text-right">
          <p className="font-medium">{session.name}</p>
          <p className="text-neutral-500">
            {section === "staff" ? "Staff and accounts" : "Sales and staff"}
          </p>
        </div>
        <Link
          href="/"
          className="rounded-full border border-neutral-300 px-4 py-2 text-sm transition hover:border-black hover:bg-black hover:text-white"
        >
          Website
        </Link>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-full border border-neutral-300 px-4 py-2 text-sm transition hover:border-black hover:bg-black hover:text-white"
          >
            Log out
          </button>
        </form>
      </div>
    </header>
  );
}
