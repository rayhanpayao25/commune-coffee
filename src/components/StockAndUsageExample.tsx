"use client";

import { useState } from "react";

type StockUsageRecord = {
  id: string;
  item: string;
  stocks: string;
  used: string;
};

export function StockAndUsageExample() {
  const [records, setRecords] = useState<StockUsageRecord[]>([
    { id: "1", item: "Csdddddups", stocks: "1,085", used: "128" },
    { id: "2", item: "Milk", stocks: "1 case & 4 pcs & 1/2", used: "6" },
    { id: "3", item: "Oatside", stocks: "1/2", used: "12" },
    { id: "4", item: "Matcha", stocks: "13", used: "13" },
    { id: "5", item: "Hojicha", stocks: "1", used: "0" },
    { id: "6", item: "Condensed", stocks: "22", used: "8" },
    { id: "7", item: "Kyoto", stocks: "-", used: "-" },
    { id: "8", item: "Whip", stocks: "15", used: "1" },
    { id: "9", item: "All-purpose", stocks: "-", used: "2" },
    
  ]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Daily Stocks & Usage Log</h2>
        <p className="text-neutral-500 text-sm">Halimbawa ng tala batay sa iyong handwritten logbook (09/09/26).</p>
      </div>

      <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white shadow-sm">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-medium">
              <th className="p-4">Item Name</th>
              <th className="p-4 text-right">Stocks</th>
              <th className="p-4 text-right">Used</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id} className="border-b border-neutral-100 hover:bg-neutral-50/50">
                <td className="p-4 font-medium text-neutral-900">{r.item}</td>
                <td className="p-4 text-right font-semibold">{r.stocks}</td>
                <td className="p-4 text-right font-semibold text-neutral-600">{r.used}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}