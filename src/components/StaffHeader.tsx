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
    <header className="border-b border-neutral-200 bg-white px-3 py-3 sm:px-6 sm:py-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center justify-between gap-3 sm:justify-start sm:gap-6">
          <BrandLogo size="sm" align="start" />
          <nav className="flex items-center gap-1 rounded-full border border-neutral-200 bg-neutral-50 p-1">
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
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition sm:px-5 sm:py-2 ${
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

        <div className="flex min-w-0 items-center justify-between gap-2 sm:justify-end sm:gap-4">
          <div className="min-w-0 text-left sm:text-right">
            <p className="truncate text-sm font-medium">{session.name}</p>
            <p className="hidden text-neutral-500 sm:block text-sm">
              {section === "staff" ? "Staff and accounts" : "Sales, menu, and inventory"}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/"
              className="rounded-full border border-neutral-300 px-3 py-1.5 text-xs transition hover:border-black hover:bg-black hover:text-white sm:px-4 sm:py-2 sm:text-sm"
            >
              Website
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-full border border-neutral-300 px-3 py-1.5 text-xs transition hover:border-black hover:bg-black hover:text-white sm:px-4 sm:py-2 sm:text-sm"
              >
                Log out
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  );
}
