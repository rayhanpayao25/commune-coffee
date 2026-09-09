"use client";

import { useState, useEffect } from "react";
import { formatMoney } from "@/lib/menu";
import { paymentLabel } from "@/lib/payments";
import {
  bestSellers,
  busiestDay,
  cafeHours,
  categorySales,
  changePercent,
  lastNDays,
  liveOrders,
  lowSellers,
  ordersOnDay,
  paymentStats,
  productStats,
  promoStats,
  salesByHour,
  salesByYearMonths,
  sumSales,
  totalDiscount,
  unitsSold,
} from "@/lib/analytics";
import type { Order, StoreData } from "@/lib/types";

type CustomEntry = {
  id: string;
  title: string;
  reason: string;
  amount: number;
  date: string;
};

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string | null;
}) {
  return (
    <div className="border border-neutral-200 bg-white p-5">
      <p className="text-xs tracking-[0.25em] text-neutral-500 uppercase">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold sm:text-3xl">{value}</p>
      {hint ? <p className="mt-2 text-xs text-neutral-500">{hint}</p> : null}
    </div>
  );
}

function deltaHint(current: number, previous: number, suffix: string) {
  const pct = changePercent(current, previous);
  if (pct === null) return null;
  if (pct === 0) return `Even vs ${suffix}`;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct}% vs ${suffix}`;
}

function VerticalBars({
  items,
}: {
  items: { key: string; label: string; value: number; caption: string; display: string }[];
}) {
  const max = Math.max(...items.map((item) => item.value), 1);
  return (
    <div className="mt-6 flex h-64 items-end gap-2 pb-6 overflow-x-auto">
      {items.map((item, idx) => (
        <div key={`${item.key}-${idx}`} className="flex min-w-[32px] flex-1 flex-col items-center h-full justify-end">
          <p className="mb-2 text-[10px] text-neutral-400 whitespace-nowrap">{item.display}</p>
          <div className="flex w-full items-end flex-1">
            <div
              className="w-full bg-black"
              style={{ height: `${Math.max((item.value / max) * 100, item.value > 0 ? 6 : 0)}%` }}
              title={item.display}
            />
          </div>
          <span className="mt-2 text-[11px] font-medium text-neutral-700 whitespace-nowrap truncate max-w-full">{item.label}</span>
          <span className="text-[10px] text-neutral-500 whitespace-nowrap">{item.caption}</span>
        </div>
      ))}
    </div>
  );
}

function HorizontalBars({
  items,
  empty,
}: {
  items: { key: string; label: string; value: number; left: string; right: string }[];
  empty: string;
}) {
  if (items.length === 0) {
    return <p className="mt-6 text-sm text-neutral-500">{empty}</p>;
  }
  const max = Math.max(...items.map((item) => item.value), 1);
  return (
    <ul className="mt-5 space-y-3">
      {items.map((item, idx) => (
        <li key={`${item.key}-${idx}`}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate">{item.label}</span>
            <span className="shrink-0 text-neutral-500">{item.right}</span>
          </div>
          <div className="mt-1.5 h-2 bg-neutral-200">
            <div
              className="h-full bg-black"
              style={{ width: `${Math.max((item.value / max) * 100, item.value > 0 ? 4 : 0)}%` }}
            />
          </div>
          <p className="mt-1 text-[11px] text-neutral-500">{item.left}</p>
        </li>
      ))}
    </ul>
  );
}

function formatDateStr(date: Date) {
  return date.toLocaleDateString("en-US", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function toInputDateStr(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function AdminDashboard({ store }: { store: StoreData }) {
  const [isClient, setIsClient] = useState(false);
  const [filterDateStr, setFilterDateStr] = useState("");
  const [rangeType, setRangeType] = useState<string>("today");
  const [activeFilterMode, setActiveFilterMode] = useState<"range" | "date">("range");

  const [expenses, setExpenses] = useState<CustomEntry[]>([]);
  const [credits, setCredits] = useState<CustomEntry[]>([]);

  useEffect(() => {
    setIsClient(true);
    const today = new Date();
    setFilterDateStr(toInputDateStr(today));

    const savedExpenses = localStorage.getItem("cafe_expenses");
    if (savedExpenses) {
      try { setExpenses(JSON.parse(savedExpenses)); } catch (e) {}
    }

    const savedCredits = localStorage.getItem("cafe_credits");
    if (savedCredits) {
      try { setCredits(JSON.parse(savedCredits)); } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem("cafe_expenses", JSON.stringify(expenses));
    }
  }, [expenses, isClient]);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem("cafe_credits", JSON.stringify(credits));
    }
  }, [credits, isClient]);

  const [newExpTitle, setNewExpTitle] = useState("");
  const [newExpReason, setNewExpReason] = useState("");
  const [newExpAmount, setNewExpAmount] = useState("");

  const [newCredTitle, setNewCredTitle] = useState("");
  const [newCredReason, setNewCredReason] = useState("");
  const [newCredAmount, setNewCredAmount] = useState("");

  let now = new Date();
  const startOfPeriod = new Date();

  const isTodaySelected = activeFilterMode === "date" || (activeFilterMode === "range" && rangeType === "today");

  if (activeFilterMode === "date" && filterDateStr) {
    now = new Date(`${filterDateStr}T23:59:59+08:00`);
    startOfPeriod.setTime(now.getTime());
    startOfPeriod.setHours(0, 0, 0, 0);
  } else {
    now = new Date();
    startOfPeriod.setTime(now.getTime());
    
    if (rangeType === "today") {
      startOfPeriod.setHours(0, 0, 0, 0);
    } else if (rangeType === "week") {
      startOfPeriod.setDate(now.getDate() - 6);
      startOfPeriod.setHours(0, 0, 0, 0);
    } else if (rangeType === "lastWeek") {
      const dayOfWeek = now.getDay();
      const diffToLastMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const lastMonday = new Date(now);
      lastMonday.setDate(now.getDate() - diffToLastMonday - 7);
      lastMonday.setHours(0, 0, 0, 0);

      const lastSunday = new Date(lastMonday);
      lastSunday.setDate(lastMonday.getDate() + 6);
      lastSunday.setHours(23, 59, 59, 999);

      startOfPeriod.setTime(lastMonday.getTime());
      now.setTime(lastSunday.getTime());
    } else if (rangeType === "month") {
      startOfPeriod.setDate(1);
      startOfPeriod.setHours(0, 0, 0, 0);
    } else if (rangeType === "lastMonth") {
      startOfPeriod.setMonth(now.getMonth() - 1);
      startOfPeriod.setDate(1);
      startOfPeriod.setHours(0, 0, 0, 0);
      now.setDate(0);
      now.setHours(23, 59, 59, 999);
    } else if (rangeType === "thisYear") {
      startOfPeriod.setMonth(0, 1);
      startOfPeriod.setHours(0, 0, 0, 0);
    } else if (rangeType === "lastYear") {
      const prevYear = now.getFullYear() - 1;
      startOfPeriod.setFullYear(prevYear, 0, 1);
      startOfPeriod.setHours(0, 0, 0, 0);
      now.setFullYear(prevYear, 11, 31);
      now.setHours(23, 59, 59, 999);
    }
  }

  const todayDateStr = formatDateStr(now);
  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(now.getDate() - 1);
  const yesterdayDateStr = formatDateStr(yesterdayDate);

  const today = ordersOnDay(store.orders, now);
  const yesterday = ordersOnDay(store.orders, yesterdayDate);
  const week = lastNDays(store.orders, 7, now);
  const currentWeekStart = new Date(now);
  currentWeekStart.setDate(now.getDate() - 6);
  const currentWeekRangeStr = `${formatDateStr(currentWeekStart)} – ${todayDateStr}`;

  let trackingItems: { key: string; label: string; value: number; caption: string; display: string }[] = [];
  let trackingTitle = "Sales tracking";
  let trackingSubtitle = "";

  if (rangeType === "month" || rangeType === "lastMonth") {
    const daysInMonth = rangeType === "month" ? now.getDate() : 30;
    const monthDays = lastNDays(store.orders, daysInMonth, now);
    trackingTitle = `Sales tracking · ${rangeType === "month" ? "This Month" : "Last Month"}`;
    trackingItems = monthDays.map((d) => ({
      key: d.date,
      label: d.label.split(",")[0],
      value: d.sales,
      display: formatMoney(d.sales),
      caption: `${d.orders} tix`,
    }));
  } else if (rangeType === "thisYear") {
    trackingTitle = "Sales tracking · This Year (Monthly)";
    const yearMonths = salesByYearMonths(store.orders);
    trackingItems = yearMonths.map((m) => ({
      key: m.key,
      label: m.label,
      value: m.sales,
      display: m.sales > 0 ? formatMoney(m.sales) : "",
      caption: `${m.orders} tix`,
    }));
  } else if (rangeType === "lastYear") {
    trackingTitle = "Sales tracking · Last Year (Monthly)";
    const targetYear = now.getFullYear();
    const yearMonths = salesByYearMonths(store.orders, targetYear);
    trackingItems = yearMonths.map((m) => ({
      key: m.key,
      label: m.label,
      value: m.sales,
      display: m.sales > 0 ? formatMoney(m.sales) : "",
      caption: `${m.orders} tix`,
    }));
  } else if (rangeType === "week" || rangeType === "lastWeek") {
    trackingTitle = rangeType === "lastWeek" ? "Sales tracking · Last Week" : "Sales tracking · 7 days";
    trackingSubtitle = currentWeekRangeStr;
    const targetWeekDays = lastNDays(store.orders, 7, now);
    trackingItems = targetWeekDays.map((day) => ({
      key: day.date,
      label: day.label,
      value: day.sales,
      display: formatMoney(day.sales),
      caption: `${day.orders} tix`,
    }));
  }

  const filteredOrdersList = liveOrders(store.orders).filter((order) => {
    const orderTime = new Date(order.createdAt).getTime();
    return orderTime >= startOfPeriod.getTime() && orderTime <= now.getTime();
  });

  const productStatsList = productStats(filteredOrdersList, store.menu);
  const best = bestSellers(productStatsList, 5);
  const low = lowSellers(productStatsList, 5);
  
  const categories = categorySales(productStatsList).filter((item) => item.qty > 0);
  
  // Custom mapping para siguraduhing ang bibilangin ay ang total item quantity sa halip na order count lang
  const rawHours = salesByHour(filteredOrdersList, now, rangeType === "week" && activeFilterMode === "range" ? 7 : 1);
  const updatedHoursMap = rawHours.map(slot => {
    const slotOrders = filteredOrdersList.filter(o => {
      const orderHour = new Date(o.createdAt).getHours();
      return orderHour === slot.hour;
    });
    const totalQtyInHour = slotOrders.reduce((acc, order) => {
      return acc + order.items.reduce((sum, item) => sum + item.qty, 0);
    }, 0);
    return {
      ...slot,
      orders: totalQtyInHour, // Ginagamit na natin ang actual item quantity
    };
  });

  const hours = cafeHours(updatedHoursMap);
  const peak = hours.reduce(
    (bestHour, slot) => (slot.orders > bestHour.orders ? slot : bestHour),
    hours[0],
  );

  const busy = busiestDay(week);
  const promos = promoStats(filteredOrdersList);
  
  const payments = paymentStats(filteredOrdersList);
  const totalSalesAmount = sumSales(filteredOrdersList);
  const totalExpensesAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalCreditsAmount = credits.reduce((sum, c) => sum + c.amount, 0);

  const netProfitOrLoss = totalSalesAmount - (totalExpensesAmount + totalCreditsAmount);

  const drinks = unitsSold(productStatsList);
  const discounts = totalDiscount(filteredOrdersList);
  
  const computedAverageTicket = filteredOrdersList.length > 0 
    ? totalSalesAmount / filteredOrdersList.length 
    : 0;

  const latest = [...store.orders]
    .filter((order) => {
      const orderTime = new Date(order.createdAt).getTime();
      return orderTime >= startOfPeriod.getTime() && orderTime <= now.getTime();
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpTitle || !newExpAmount) return;
    const item: CustomEntry = {
      id: String(Date.now()),
      title: newExpTitle,
      reason: newExpReason,
      amount: parseFloat(newExpAmount) || 0,
      date: toInputDateStr(new Date()),
    };
    setExpenses([item, ...expenses]);
    setNewExpTitle("");
    setNewExpReason("");
    setNewExpAmount("");
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(expenses.filter((ex) => ex.id !== id));
  };

  const handleAddCredit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCredTitle || !newCredAmount) return;
    const item: CustomEntry = {
      id: String(Date.now()),
      title: newCredTitle,
      reason: newCredReason,
      amount: parseFloat(newCredAmount) || 0,
      date: toInputDateStr(new Date()),
    };
    setCredits([item, ...credits]);
    setNewCredTitle("");
    setNewCredReason("");
    setNewCredAmount("");
  };

  const handleDeleteCredit = (id: string) => {
    setCredits(credits.filter((cr) => cr.id !== id));
  };

  if (!isClient) {
    return <div className="p-8 text-center text-neutral-500">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-8 px-4 py-6 sm:space-y-10 sm:px-6 sm:py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.3em] text-neutral-500 uppercase">
            Sales analysis
          </p>
          <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">
            Track every ticket
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div 
            className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 shadow-sm transition ${
              activeFilterMode === "range" 
                ? "bg-white border-black ring-1 ring-black" 
                : "bg-white border-neutral-300 opacity-75"
            }`}
          >
            <span className="text-xs font-medium text-neutral-500">Range:</span>
            <select
              value={rangeType}
              onChange={(e) => {
                setRangeType(e.target.value);
                setActiveFilterMode("range");
              }}
              onClick={() => setActiveFilterMode("range")}
              className="text-sm bg-transparent outline-none cursor-pointer"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="lastWeek">Last Week</option>
              <option value="month">This Month</option>
              <option value="lastMonth">Last Month</option>
              <option value="thisYear">This Year</option>
              <option value="lastYear">Last Year</option>
            </select>
          </div>

          <div 
            className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 shadow-sm transition ${
              activeFilterMode === "date" 
                ? "bg-white border-black ring-1 ring-black" 
                : "bg-white border-neutral-300 opacity-75"
            }`}
          >
            <span className="text-xs font-medium text-neutral-500">Filter Date:</span>
            <input
              type="date"
              value={filterDateStr}
              onChange={(e) => {
                setFilterDateStr(e.target.value);
                setActiveFilterMode("date");
              }}
              onClick={() => setActiveFilterMode("date")}
              className="text-sm bg-transparent outline-none cursor-pointer"
            />
          </div>

          <p
            className={`rounded-full px-4 py-2 text-sm ${
              store.pos.isOpen
                ? "bg-black text-white"
                : "border border-neutral-300 text-neutral-600"
            }`}
          >
            POS {store.pos.isOpen ? "open" : "closed"}
            {store.pos.openedBy ? ` · ${store.pos.openedBy}` : ""}
          </p>
        </div>
      </div>

      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 pb-3">
          <h2 className="text-xs tracking-[0.25em] text-neutral-500 uppercase">
            Performance Overview
          </h2>
          <span className="rounded bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
            Selected Range: {activeFilterMode === "range" ? rangeType.toUpperCase() : filterDateStr}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {isTodaySelected ? (
            <>
              <Metric
                label="Today's Sales"
                value={formatMoney(sumSales(today))}
                hint={`For ${todayDateStr} (vs ${yesterdayDateStr}: ${formatMoney(sumSales(yesterday))})`}
              />
              <Metric
                label="Today's Orders"
                value={String(today.length)}
                hint={deltaHint(today.length, yesterday.length, `yesterday (${yesterdayDateStr})`)}
              />
            </>
          ) : (
            <>
              <Metric
                label="Period Sales"
                value={formatMoney(filteredOrdersList.reduce((s, o) => s + o.total, 0))}
                hint={`Selected Range Sales`}
              />
              <Metric 
                label="Period Orders" 
                value={String(filteredOrdersList.length)} 
                hint={`Total tickets`} 
              />
            </>
          )}

          <Metric
            label="Average Ticket"
            value={formatMoney(computedAverageTicket)}
            hint={
              filteredOrdersList.length === 0 
                ? `No tickets in selected period` 
                : `${filteredOrdersList.length} tickets in selected period`
            }
          />

          <Metric
            label="Drinks Sold"
            value={String(drinks)}
            hint={`Selected period`}
          />

          <Metric
            label="Peak Hour"
            value={peak && peak.orders > 0 ? peak.label : "—"}
            hint={peak && peak.orders > 0 ? `${peak.orders} items · ${formatMoney(peak.sales)}` : "Selected period"}
          />

          {rangeType === "week" && (
            <Metric
              label="Busiest Day"
              value={busy?.label ?? "—"}
              hint={busy ? `${busy.date} · ${formatMoney(busy.sales)}` : null}
            />
          )}
        </div>
      </section>

      <section className="border border-neutral-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.25em] text-neutral-500 uppercase">
              Net Summary (Revenue - Expenses - Credits)
            </p>
            <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">
              {formatMoney(netProfitOrLoss)}
            </h2>
          </div>
          <div className="text-right text-xs text-neutral-500 space-y-1">
            <p>Total Revenue: <span className="font-medium text-black">{formatMoney(totalSalesAmount)}</span></p>
            <p>Total Expenses: <span className="font-medium text-black">{formatMoney(totalExpensesAmount)}</span></p>
            <p>Total Credits: <span className="font-medium text-black">{formatMoney(totalCreditsAmount)}</span></p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        {!isTodaySelected && (
          <div className="border border-neutral-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs tracking-[0.25em] text-neutral-500 uppercase">
                {trackingTitle}
              </h2>
              <span className="text-[11px] text-neutral-400">{trackingSubtitle}</span>
            </div>
            <VerticalBars items={trackingItems} />
          </div>
        )}

        <div className={`border border-neutral-200 bg-white p-5 ${isTodaySelected ? "lg:col-span-2" : ""}`}>
          <div className="flex items-center justify-between">
            <h2 className="text-xs tracking-[0.25em] text-neutral-500 uppercase">
              Peak hours (by item volume) · 11:00 AM – 11:00 PM
            </h2>
            <span className="text-[11px] text-neutral-400">
              {isTodaySelected ? `Today (${todayDateStr})` : "Selected period"}
            </span>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[560px]">
              <VerticalBars
                items={hours.map((slot) => ({
                  key: String(slot.hour),
                  label: slot.label,
                  value: slot.orders,
                  display: slot.orders > 0 ? `${slot.orders} items` : "",
                  caption: "",
                }))}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="border border-neutral-200 bg-white p-5">
          <h2 className="text-xs tracking-[0.25em] text-neutral-500 uppercase">
            Best selling drinks
          </h2>
          
          <HorizontalBars
            empty="No drinks sold in this period."
            items={best.map((item) => ({
              key: item.id,
              label: item.name,
              value: item.qty,
              left: `${item.qty} sold`,
              right: formatMoney(item.sales),
            }))}
          />
        </div>

        <div className="border border-neutral-200 bg-white p-5">
          <h2 className="text-xs tracking-[0.25em] text-neutral-500 uppercase">
            Low selling drinks
          </h2>
          <HorizontalBars
            empty="No drinks found in menu."
            items={low.map((item) => ({
              key: item.id,
              label: item.name,
              value: item.qty,
              left: item.qty === 0 ? "No sales" : `${item.qty} sold`,
              right: formatMoney(item.sales),
            }))}
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="border border-neutral-200 bg-white p-5">
          <h2 className="text-xs tracking-[0.25em] text-neutral-500 uppercase">
            Sales by category (by item quantity)
          </h2>
          <p className="mt-1 text-[11px] text-neutral-400">Selected Range</p>
          <HorizontalBars
            empty="No category sales in this period."
            items={categories
              .sort((a, b) => b.qty - a.qty)
              .map((item) => ({
                key: item.name,
                label: item.name,
                value: item.qty,
                left: `${item.qty} items`,
                right: item.sales ? formatMoney(item.sales) : '₱0.00',
              }))}
          />
        </div>

        <div className="border border-neutral-200 bg-white p-5">
          <h2 className="text-xs tracking-[0.25em] text-neutral-500 uppercase">
            Payment Mix (Total Breakdown)
          </h2>
          <p className="mt-1 text-[11px] text-neutral-400">Total Collections Breakdown</p>
          <div className="mt-4 space-y-3">
            {payments.map((p, pIdx) => (
              <div key={`${p.method}-${pIdx}`} className="flex justify-between items-center text-sm border-b border-neutral-100 pb-2">
                <div>
                  <p className="font-medium">{p.label}</p>
                  <p className="text-xs text-neutral-500">{p.count} transactions</p>
                </div>
                <span className="font-semibold">{formatMoney(p.sales)}</span>
              </div>
            ))}
            <div className="flex justify-between items-center text-sm font-bold pt-2 border-t border-neutral-200">
              <span>Total Revenue:</span>
              <span>{formatMoney(totalSalesAmount)}</span>
            </div>
          </div>
        </div>

        <div className="border border-neutral-200 bg-white p-5">
          <h2 className="text-xs tracking-[0.25em] text-neutral-500 uppercase">
            Promotions
          </h2>
          <p className="mt-1 text-[11px] text-neutral-400">Selected Range</p>
          {promos.length === 0 ? (
            <div className="mt-6 space-y-2 text-sm text-neutral-500">
              <p>No discounts on tickets in this period.</p>
              <p>Discounts {formatMoney(discounts)}</p>
            </div>
          ) : (
            <HorizontalBars
              empty="No promotions used."
              items={promos.map((item) => ({
                key: item.label,
                label: item.label,
                value: item.count,
                left: `${item.count} tickets`,
                right: formatMoney(item.discount),
              }))}
            />
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="border border-neutral-200 bg-white p-5 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xs tracking-[0.25em] text-neutral-500 uppercase">Expenses Tracker</h2>
              <p className="text-sm font-semibold mt-1">Total: {formatMoney(totalExpensesAmount)}</p>
            </div>
          </div>

          <form onSubmit={handleAddExpense} className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-neutral-100">
            <input
              type="text"
              placeholder="Expense title..."
              value={newExpTitle}
              onChange={(e) => setNewExpTitle(e.target.value)}
              className="border border-neutral-300 rounded px-3 py-1.5 text-sm outline-none focus:border-black"
            />
            <input
              type="text"
              placeholder="Reason..."
              value={newExpReason}
              onChange={(e) => setNewExpReason(e.target.value)}
              className="border border-neutral-300 rounded px-3 py-1.5 text-sm outline-none focus:border-black"
            />
            <input
              type="number"
              placeholder="Amount (₱)"
              value={newExpAmount}
              onChange={(e) => setNewExpAmount(e.target.value)}
              className="border border-neutral-300 rounded px-3 py-1.5 text-sm outline-none focus:border-black"
            />
            <button
              type="submit"
              className="sm:col-span-3 bg-black text-white rounded px-3 py-1.5 text-sm font-medium hover:bg-neutral-800 transition"
            >
              Add Expense
            </button>
          </form>

          <div className="overflow-x-auto max-h-48 overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-neutral-400 text-xs border-b border-neutral-100">
                <tr>
                  <th className="py-2">Title</th>
                  <th className="py-2">Reason</th>
                  <th className="py-2 text-right">Amount</th>
                  <th className="py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr><td colSpan={4} className="py-4 text-center text-neutral-400 text-xs">No expenses added yet.</td></tr>
                ) : (
                  expenses.map((ex, exIdx) => (
                    <tr key={`${ex.id}-${exIdx}`} className="border-b border-neutral-50 text-xs">
                      <td className="py-2">{ex.title}</td>
                      <td className="py-2 text-neutral-500">{ex.reason || "—"}</td>
                      <td className="py-2 text-right font-medium">{formatMoney(ex.amount)}</td>
                      <td className="py-2 text-right">
                        <button
                          onClick={() => handleDeleteExpense(ex.id)}
                          className="text-red-500 hover:text-red-700 font-medium px-2 py-1"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="border border-neutral-200 bg-white p-5 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xs tracking-[0.25em] text-neutral-500 uppercase">Credits</h2>
              <p className="text-sm font-semibold mt-1">Total: {formatMoney(totalCreditsAmount)}</p>
            </div>
          </div>

          <form onSubmit={handleAddCredit} className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-neutral-100">
            <input
              type="text"
              placeholder="Credit title..."
              value={newCredTitle}
              onChange={(e) => setNewCredTitle(e.target.value)}
              className="border border-neutral-300 rounded px-3 py-1.5 text-sm outline-none focus:border-black"
            />
            <input
              type="text"
              placeholder="Reason..."
              value={newCredReason}
              onChange={(e) => setNewCredReason(e.target.value)}
              className="border border-neutral-300 rounded px-3 py-1.5 text-sm outline-none focus:border-black"
            />
            <input
              type="number"
              placeholder="Amount (₱)"
              value={newCredAmount}
              onChange={(e) => setNewCredAmount(e.target.value)}
              className="border border-neutral-300 rounded px-3 py-1.5 text-sm outline-none focus:border-black"
            />
            <button
              type="submit"
              className="sm:col-span-3 bg-black text-white rounded px-3 py-1.5 text-sm font-medium hover:bg-neutral-800 transition"
            >
              Add Credit
            </button>
          </form>

          <div className="overflow-x-auto max-h-48 overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-neutral-400 text-xs border-b border-neutral-100">
                <tr>
                  <th className="py-2">Title</th>
                  <th className="py-2">Reason</th>
                  <th className="py-2 text-right">Amount</th>
                  <th className="py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {credits.length === 0 ? (
                  <tr><td colSpan={4} className="py-4 text-center text-neutral-400 text-xs">No credits added yet.</td></tr>
                ) : (
                  credits.map((cr, crIdx) => (
                    <tr key={`${cr.id}-${crIdx}`} className="border-b border-neutral-50 text-xs">
                      <td className="py-2">{cr.title}</td>
                      <td className="py-2 text-neutral-500">{cr.reason || "—"}</td>
                      <td className="py-2 text-right font-medium">{formatMoney(cr.amount)}</td>
                      <td className="py-2 text-right">
                        <button
                          onClick={() => handleDeleteCredit(cr.id)}
                          className="text-red-500 hover:text-red-700 font-medium px-2 py-1"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="border border-neutral-200 bg-white p-5">
        <h2 className="text-xs tracking-[0.25em] text-neutral-500 uppercase">
          Recent orders
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="border-b border-neutral-200 text-neutral-500">
              <tr>
                <th className="py-3 font-normal">Time</th>
                <th className="py-3 font-normal">Barista</th>
                <th className="py-3 font-normal">Items</th>
                <th className="py-3 font-normal">Status</th>
                <th className="py-3 font-normal">Promo</th>
                <th className="py-3 font-normal">Pay</th>
                <th className="py-3 font-normal text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {latest.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-neutral-500">
                    No recent orders found for the selected range.
                  </td>
                </tr>
              ) : (
                latest.map((order: Order, ordIdx: number) => (
                  <tr key={`${order.id}-${ordIdx}`} className="border-b border-neutral-200">
                    <td className="py-3 whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleString("en-US", {
                        timeZone: "Asia/Manila",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </td>
                    <td className="py-3">{order.baristaName}</td>
                    <td className="py-3 text-neutral-600">
                      {order.items
                        .map((item) => `${item.qty}× ${item.name}`)
                        .join(", ")}
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                          order.voided
                        ? "bg-red-100 text-red-700"
                        : "bg-green-100 text-green-700"
                        }`}
                      >
                        {order.voided ? "Voided" : "Completed"}
                      </span>
                    </td>
                    <td className="py-3 text-neutral-500">
                      {order.promoLabel ?? "—"}
                    </td>
                    <td className="py-3 text-neutral-500">
                      {paymentLabel(order.paymentMethod)}
                    </td>
                    <td className="py-3 text-right">{formatMoney(order.total)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}