"use client";

import { useState, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { UserManager } from "@/components/UserManager";
import { StockAndUsageExample } from "@/components/StockAndUsageExample";
import { SalePurchaseTransactions } from "@/components/SalePurchaseTransactions";
import type { PublicStaffUser } from "@/lib/users";
import type { Session, StoreData } from "@/lib/types";

type PanelType = "sales" | "staff" | "transactions" | "example";

type AdminShellProps = {
  session: Session;
  users: PublicStaffUser[];
  store: StoreData;
  children: ReactNode;
};

export function AdminShell({ session, users, store, children }: AdminShellProps) {
  const [panel, setPanel] = useState<PanelType>("sales");
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (panel !== "transactions") return;
    const refreshTimer = window.setInterval(() => router.refresh(), 5000);
    return () => window.clearInterval(refreshTimer);
  }, [panel, router]);

  // Basahin ang localStorage pagka-load sa browser para maalala ang huling binuksang tab
  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      const savedPanel = localStorage.getItem("admin_activePanel") as PanelType;
      if (savedPanel) {
        setPanel(savedPanel);
      }
    }
  }, []);

  // I-save sa localStorage tuwing magpapalit ng tab sa taas
  const handleTabChange = (id: PanelType) => {
    setPanel(id);
    if (typeof window !== "undefined") {
      localStorage.setItem("admin_activePanel", id);
    }
  };

  // Habang naglo-load pa, i-render muna ang default para iwas hydration error
  if (!isMounted) {
    return (
      <>
        <div className="border-b border-neutral-200 bg-white px-4 py-2 sm:px-6">
          <div className="flex gap-1 overflow-x-auto">
            {(
              [
                ["sales", "Sales"],
                ["staff", "Staff"],
                ["transactions", "Transactions"],
                ["example", "Logbook Example"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className="rounded-lg px-4 py-2 text-sm whitespace-nowrap text-neutral-600 hover:text-black"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {children}
      </>
    );
  }

  return (
    <>
      <div className="border-b border-neutral-200 bg-white px-4 py-2 sm:px-6">
        <div className="flex gap-1 overflow-x-auto">
          {(
            [
              ["sales", "Sales"],
              ["staff", "Staff"],
              ["transactions", "Transactions"],
              ["example", "Logbook Example"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => handleTabChange(id)}
              className={`rounded-lg px-4 py-2 text-sm whitespace-nowrap ${
                panel === id ? "bg-black text-white" : "text-neutral-600 hover:text-black"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Render based on selected panel */}
      {panel === "sales" && children}
      {panel === "staff" && <UserManager users={users} session={session} />}
      {panel === "transactions" && <SalePurchaseTransactions store={store} />}
      {panel === "example" && <StockAndUsageExample />}
    </>
  );
}
