"use client";

import { useState, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { StaffHeader, type AdminSection } from "@/components/StaffHeader";
import { UserManager } from "@/components/UserManager";
import { SalePurchaseTransactions } from "@/components/SalePurchaseTransactions";
import type { PublicStaffUser } from "@/lib/users";
import type { Session, StoreData } from "@/lib/types";

type AdminPanel = "sales" | "transactions";

type AdminShellProps = {
  session: Session;
  users: PublicStaffUser[];
  store: StoreData;
  children: ReactNode;
};

export function AdminShell({ session, users, store, children }: AdminShellProps) {
  const [section, setSection] = useState<AdminSection>("admin");
  const [panel, setPanel] = useState<AdminPanel>("sales");
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (section !== "admin" || panel !== "transactions") return;
    const refreshTimer = window.setInterval(() => router.refresh(), 5000);
    return () => window.clearInterval(refreshTimer);
  }, [section, panel, router]);

  useEffect(() => {
    setIsMounted(true);
    const savedSection = window.localStorage.getItem("admin_section") as AdminSection | null;
    const savedPanel = window.localStorage.getItem("admin_activePanel");

    if (savedSection === "staff" || savedPanel === "staff") {
      setSection("staff");
      return;
    }

    if (savedSection === "admin") {
      setSection("admin");
    }
    if (savedPanel === "transactions") {
      setPanel("transactions");
    }
  }, []);

  function handleSectionChange(next: AdminSection) {
    setSection(next);
    window.localStorage.setItem("admin_section", next);
    if (next === "staff") {
      window.localStorage.setItem("admin_activePanel", "staff");
    }
  }

  function handleTabChange(id: AdminPanel) {
    setPanel(id);
    window.localStorage.setItem("admin_activePanel", id);
    window.localStorage.setItem("admin_section", "admin");
  }

  return (
    <>
      <StaffHeader
        session={session}
        section={isMounted ? section : "admin"}
        onSectionChange={handleSectionChange}
      />

      {isMounted && section === "staff" ? (
        <UserManager
          users={users}
          session={session}
          loginActivity={store.loginActivity ?? []}
        />
      ) : (
        <>
          <div className="border-b border-neutral-200 bg-white px-3 py-2 sm:px-6">
            <div className="flex gap-1 overflow-x-auto">
              {(
                [
                  ["sales", "Sales"],
                  ["transactions", "Transactions"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleTabChange(id)}
                  className={`rounded-lg px-4 py-2 text-sm whitespace-nowrap ${
                    isMounted && panel === id
                      ? "bg-black text-white"
                      : "text-neutral-600 hover:text-black"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {!isMounted || panel === "sales" ? children : null}
          {isMounted && panel === "transactions" ? (
            <SalePurchaseTransactions store={store} />
          ) : null}
        </>
      )}
    </>
  );
}
