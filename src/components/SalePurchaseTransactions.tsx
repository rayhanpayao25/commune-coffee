import { useEffect, useRef, useState } from "react";
import { deleteAdminRecord, saveAdminData } from "@/actions/pos";
import { costingIngredientForItem, cupsFromQuantity, formatQty, namesMatch, perCupAmount, remainingForUsages, roundQty, stockLedgerForDate } from "@/lib/inventory";
import { phDateString, phDateTimeLabel, phIsoFromDate, phNowDateTime } from "@/lib/datetime";
import type { Order, StoreData } from "@/lib/types";

type TabType = "transactions" | "stock" | "restock" | "costing" | "used";

type Transaction = {
  id: string;
  productName: string;
  type: "Purchase" | "Sale";
  quantity: number;
  price: number;
  amount: number;
  date: string;
  createdAt: string;
};

function ordersToTransactions(orders: Order[]): Transaction[] {
  return orders
    .filter((order) => !order.voided)
    .map((order) => {
      const quantity = order.items.reduce((sum, item) => sum + item.qty, 0);
      const amount = order.total;
      return {
        id: order.id,
        productName: order.items.map((item) => `${item.qty}x ${item.name}`).join(", "),
        type: (order.recordType === "Purchase" ? "Purchase" : "Sale") as "Purchase" | "Sale",
        quantity,
        price: quantity > 0 ? amount / quantity : amount,
        amount,
        date: phDateString(order.createdAt),
        createdAt: order.createdAt,
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
}

function transactionToOrder(transaction: Transaction, existing?: Order): Order {
  const createdAt = phIsoFromDate(transaction.date, existing?.createdAt);
  const sameItems =
    existing &&
    existing.items.map((item) => `${item.qty}x ${item.name}`).join(", ") === transaction.productName &&
    existing.items.reduce((sum, item) => sum + item.qty, 0) === transaction.quantity;

  return {
    id: transaction.id,
    createdAt,
    baristaName: existing?.baristaName ?? "Admin",
    items: sameItems && existing
      ? existing.items
      : [
          {
            productId: existing?.items[0]?.productId ?? `manual-${transaction.id}`,
            name: transaction.productName,
            qty: transaction.quantity,
            price: transaction.price,
          },
        ],
    total: transaction.amount,
    subtotal: existing?.subtotal ?? transaction.amount,
    discount: existing?.discount,
    promoLabel: existing?.promoLabel,
    paymentMethod: existing?.paymentMethod ?? "cash",
    ticketNo: existing?.ticketNo,
    paid: existing?.paid ?? transaction.amount,
    change: existing?.change,
    voided: existing?.voided,
    recordType: transaction.type,
  };
}

type StockItem = {
  id: string;
  name: string;
  category: string;
  stock: number;
  unit: string;
};

type RestockRecord = {
  id: string;
  itemName: string;
  quantityAdded: number;
  date: string;
};

  type CostingItem = {
    id: string;
    productName: string;
    ingredients: { name: string; amount: number; unit: string; outputCups?: number }[];
  };

type UsageRecord = {
  id: string;
  date: string;
  itemName: string;
  usedAmount: number;
  unit: string;
  remaining: number;
  soldAs: string;
};

export function SalePurchaseTransactions({ store }: { store: StoreData }) {
  const [activeTab, setActiveTab] = useState<TabType>("transactions");
  const persistedTransactions: Transaction[] = ordersToTransactions(store.orders);
  const persistedStocks: StockItem[] = store.inventory.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    stock: item.stock,
    unit: item.unit || "pcs",
  }));
  const reconstructedRemaining = remainingForUsages(
    store.usageLogs,
    store.restocks ?? [],
    store.inventory,
  );
  const persistedUsages: UsageRecord[] = store.usageLogs
    .map((entry, index) => {
      const order = store.orders.find((item) => item.id === entry.orderId);
      return {
        id: entry.id,
        date: entry.date,
        itemName: entry.itemName,
        usedAmount: entry.usedAmount,
        unit: entry.unit,
        remaining: reconstructedRemaining[index] ?? entry.remaining ?? 0,
        soldAs: order && !order.voided
          ? order.items.map((item) => `${item.qty}x ${item.name}`).join(", ")
          : "",
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));

  const getTodayDate = () => phDateString();

  const getNowDateTime = () => phNowDateTime();

  const [transactions, setTransactions] = useState<Transaction[]>(persistedTransactions);

  const [stocks, setStocks] = useState<StockItem[]>(persistedStocks);
  const stocksRef = useRef(stocks);
  stocksRef.current = stocks;

  const [restocks, setRestocks] = useState<RestockRecord[]>(store.restocks ?? []);
  const [costings, setCostings] = useState<CostingItem[]>(store.costings ?? []);

  const [usages, setUsages] = useState<UsageRecord[]>(persistedUsages);

  useEffect(() => {
    setTransactions(persistedTransactions);
    setStocks(persistedStocks);
    setUsages(persistedUsages);
    setRestocks(store.restocks ?? []);
    setCostings(store.costings ?? []);
  }, [store.orders, store.inventory, store.usageLogs, store.restocks, store.costings]);

  const [editTxId, setEditTxId] = useState<string | null>(null);
  const [txProduct, setTxProduct] = useState("");
  const [txType, setTxType] = useState<"Purchase" | "Sale">("Sale");
  const [txQty, setTxQty] = useState("");
  const [txPrice, setTxPrice] = useState("");
  const [txDate, setTxDate] = useState(getTodayDate());

  const [editStockId, setEditStockId] = useState<string | null>(null);
  const [stockName, setStockName] = useState("");
  const [stockCategory, setStockCategory] = useState("");
  const [stockQty, setStockQty] = useState("");
  const [stockUnit, setStockUnit] = useState("grams");

  const [editRestockId, setEditRestockId] = useState<string | null>(null);
  const [restockItem, setRestockItem] = useState("");
  const [restockQty, setRestockQty] = useState("");
  const [restockDate, setRestockDate] = useState(getTodayDate());

  const [editCostingId, setEditCostingId] = useState<string | null>(null);
  const [costingProduct, setCostingProduct] = useState("");
  const [costingIngs, setCostingIngs] = useState<{ name: string; amount: number; unit: string; outputCups?: number }[]>([
    { name: "", amount: 0, unit: "", outputCups: 0 },
  ]);

  const [inlineRestockValues, setInlineRestockValues] = useState<{ [key: string]: string }>({});
  const [stockNotice, setStockNotice] = useState<string | null>(null);

  const [filterType, setFilterType] = useState("All");
  const [filterKeyword, setFilterKeyword] = useState("");
  const [selectedDateFilter, setSelectedDateFilter] = useState("");

  const handleTotalUsedChange = (itemName: string, value: string) => {
    const nextTotal = Math.max(0, Number(value) || 0);
    setUsages((currentUsages) => {
      const matching = currentUsages.filter((usage) => namesMatch(usage.itemName, itemName) && phDateString(usage.date) === getTodayDate());
      const next = (() => {
        if (matching.length === 0) {
          return nextTotal === 0
            ? currentUsages
            : [{ id: Date.now().toString(), date: getTodayDate(), itemName, usedAmount: nextTotal, unit: stocks.find((item) => namesMatch(item.name, itemName))?.unit || "units", remaining: stocks.find((item) => namesMatch(item.name, itemName))?.stock ?? 0, soldAs: "" }, ...currentUsages];
        }
        const firstId = matching[0].id;
        const otherUsageTotal = matching.slice(1).reduce((sum, usage) => sum + usage.usedAmount, 0);
        return currentUsages.map((usage) =>
          usage.id === firstId
            ? { ...usage, usedAmount: Math.max(0, nextTotal - otherUsageTotal) }
            : usage,
        );
      })();
      void saveAdminData({
        usageLogs: next.map((entry) => ({
          id: entry.id,
          orderId: store.usageLogs.find((item) => item.id === entry.id)?.orderId || "",
          orderItemId: store.usageLogs.find((item) => item.id === entry.id)?.orderItemId || "",
          date: entry.date,
          itemName: entry.itemName,
          usedAmount: entry.usedAmount,
          unit: entry.unit,
          remaining: entry.remaining,
        })),
      });
      return next;
    });
  };

  const applyTransactionInventoryEffect = (
    currentStocks: StockItem[],
    currentUsages: UsageRecord[],
    productName: string,
    type: "Purchase" | "Sale",
    quantity: number,
    dateStr: string,
    isRevert = false,
  ) => {
    const nextStocks = currentStocks.map((item) => ({ ...item }));
    let nextUsages = [...currentUsages];

    if (type === "Sale") {
      const costing = costings.find((c) => namesMatch(c.productName, productName));
      if (costing) {
        for (const ing of costing.ingredients) {
          const stockIndex = nextStocks.findIndex((s) => namesMatch(s.name, ing.name));
          if (stockIndex === -1) continue;
          const totalUsed = roundQty(perCupAmount(ing) * quantity);
          if (totalUsed <= 0) continue;
          nextStocks[stockIndex].stock = roundQty(
            isRevert
              ? nextStocks[stockIndex].stock + totalUsed
              : Math.max(0, nextStocks[stockIndex].stock - totalUsed),
          );
          if (isRevert) {
            const idx = nextUsages.findIndex(
              (usage) =>
                namesMatch(usage.itemName, ing.name) &&
                usage.usedAmount === totalUsed &&
                phDateString(usage.date) === phDateString(dateStr),
            );
            if (idx !== -1) nextUsages.splice(idx, 1);
          } else {
            nextUsages = [
              {
                id: `${Date.now()}-${ing.name}-${Math.random()}`,
                date: dateStr,
                itemName: ing.name,
                usedAmount: totalUsed,
                unit: ing.unit,
                remaining: nextStocks[stockIndex].stock,
                soldAs: productName,
              },
              ...nextUsages,
            ];
          }
        }
      }
    } else if (type === "Purchase") {
      const stockIndex = nextStocks.findIndex((s) => namesMatch(s.name, productName));
      if (stockIndex !== -1) {
        nextStocks[stockIndex].stock = roundQty(
          isRevert
            ? Math.max(0, nextStocks[stockIndex].stock - quantity)
            : nextStocks[stockIndex].stock + quantity,
        );
      }
    }

    return { nextStocks, nextUsages };
  };

  const persistInventoryAndUsage = async (nextStocks: StockItem[], nextUsages: UsageRecord[]) => {
    setStocks(nextStocks);
    setUsages(nextUsages);
    await persistInventory(nextStocks);
    await saveAdminData({
      usageLogs: nextUsages.map((entry) => ({
        id: entry.id,
        orderId: store.usageLogs.find((item) => item.id === entry.id)?.orderId || "",
        orderItemId: store.usageLogs.find((item) => item.id === entry.id)?.orderItemId || "",
        date: entry.date,
        itemName: entry.itemName,
        usedAmount: entry.usedAmount,
        unit: entry.unit,
        remaining: entry.remaining,
      })),
    });
  };

  const persistOrders = async (nextTransactions: Transaction[]) => {
    const nextById = new Map(nextTransactions.map((item) => [item.id, item]));
    const kept = store.orders.flatMap((order) => {
      if (order.voided) return [order];
      const next = nextById.get(order.id);
      if (!next) return [];
      return [transactionToOrder(next, order)];
    });
    const created = nextTransactions
      .filter((item) => !store.orders.some((order) => order.id === item.id))
      .map((item) => transactionToOrder(item));
    await saveAdminData({ orders: [...kept, ...created] });
  };

  async function persistInventory(nextStocks: StockItem[]) {
    const existingById = new Map(store.inventory.map((item) => [item.id, item]));
    const inventory = nextStocks.map((item) => {
      const existing = existingById.get(item.id);
      return {
        id: item.id,
        name: item.name,
        category: item.category || existing?.category || "",
        stock: item.stock,
        unit: item.unit || existing?.unit || "pcs",
        cost: existing?.cost ?? 0,
        maxStock: existing?.maxStock ?? item.stock,
      };
    });
    await saveAdminData({ inventory });
  }

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txProduct || !txQty || !txPrice || !txDate) return;
    const qty = Number(txQty);
    const prc = Number(txPrice);
    if (!Number.isFinite(qty) || qty <= 0 || !Number.isFinite(prc) || prc < 0) return;

    if (editTxId) {
      const oldTx = transactions.find((t) => t.id === editTxId);
      let nextStocks = stocks;
      let nextUsages = usages;
      if (oldTx) {
        ({ nextStocks, nextUsages } = applyTransactionInventoryEffect(
          nextStocks,
          nextUsages,
          oldTx.productName,
          oldTx.type,
          oldTx.quantity,
          oldTx.date,
          true,
        ));
      }
      const nextTransactions = transactions.map((t) =>
        t.id === editTxId
          ? {
              ...t,
              productName: txProduct,
              type: txType,
              quantity: qty,
              price: prc,
              amount: qty * prc,
              date: txDate,
              createdAt: phIsoFromDate(txDate, t.createdAt),
            }
          : t,
      );
      ({ nextStocks, nextUsages } = applyTransactionInventoryEffect(
        nextStocks,
        nextUsages,
        txProduct,
        txType,
        qty,
        txDate,
        false,
      ));
      await persistInventoryAndUsage(nextStocks, nextUsages);
      setTransactions(nextTransactions);
      setEditTxId(null);
      await persistOrders(nextTransactions);
    } else {
      const newTx: Transaction = {
        id: `ord-${Date.now()}`,
        productName: txProduct,
        type: txType,
        quantity: qty,
        price: prc,
        amount: qty * prc,
        date: txDate,
        createdAt: phIsoFromDate(txDate),
      };
      const nextTransactions = [newTx, ...transactions];
      setTransactions(nextTransactions);
      const { nextStocks, nextUsages } = applyTransactionInventoryEffect(
        stocks,
        usages,
        txProduct,
        txType,
        qty,
        txDate,
        false,
      );
      await persistInventoryAndUsage(nextStocks, nextUsages);
      await persistOrders(nextTransactions);
    }
    setTxProduct("");
    setTxQty("");
    setTxPrice("");
    setTxDate(getTodayDate());
  };

  const handleEditTransaction = (t: Transaction) => {
    setEditTxId(t.id);
    setTxProduct(t.productName);
    setTxType(t.type);
    setTxQty(t.quantity.toString());
    setTxPrice(t.price.toString());
    setTxDate(t.date);
  };

  const handleDeleteTransaction = async (id: string) => {
    const tx = transactions.find((t) => t.id === id);
    if (tx) {
      const { nextStocks, nextUsages } = applyTransactionInventoryEffect(
        stocks,
        usages,
        tx.productName,
        tx.type,
        tx.quantity,
        tx.date,
        true,
      );
      await persistInventoryAndUsage(nextStocks, nextUsages);
    }
    setTransactions((current) => current.filter((t) => t.id !== id));
    await deleteAdminRecord("order", id);
  };

  const handleSaveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockName || !stockCategory || !stockQty) return;
    const qty = Number(stockQty);
    if (!Number.isFinite(qty) || qty < 0) return;
    const unit = stockUnit.trim() || "pcs";

    if (editStockId) {
      const nextStocks = stocks.map((s) =>
        s.id === editStockId ? { ...s, name: stockName, category: stockCategory, stock: qty, unit } : s,
      );
      setStocks(nextStocks);
      await persistInventory(nextStocks);
      setEditStockId(null);
    } else {
      const newItem: StockItem = {
        id: `stock-${Date.now()}`,
        name: stockName,
        category: stockCategory,
        stock: qty,
        unit,
      };
      const nextStocks = [...stocks, newItem];
      const newRestock: RestockRecord = {
        id: Date.now().toString() + Math.random(),
        itemName: stockName,
        quantityAdded: qty,
        date: getNowDateTime(),
      };
      const nextRestocks = [newRestock, ...restocks];
      setStocks(nextStocks);
      setRestocks(nextRestocks);
      await persistInventory(nextStocks);
      await saveAdminData({ restocks: nextRestocks });
    }
    setStockName("");
    setStockCategory("");
    setStockQty("");
    setStockUnit("grams");
  };

  const handleEditStock = (s: StockItem) => {
    setEditStockId(s.id);
    setStockName(s.name);
    setStockCategory(s.category);
    setStockQty(s.stock.toString());
    setStockUnit(s.unit || "pcs");
  };

  const handleDeleteStock = async (id: string) => {
    const nextStocks = stocks.filter((s) => s.id !== id);
    setStocks(nextStocks);
    setStockNotice(null);
    try {
      await persistInventory(nextStocks);
    } catch (error) {
      setStocks(stocks);
      setStockNotice(error instanceof Error ? error.message : "Could not delete that stock item.");
    }
  };

  const handleInlineRestock = async (item: StockItem) => {
    const amountStr = inlineRestockValues[item.id];
    if (!amountStr) return;
    const addQty = Number(amountStr);
    if (isNaN(addQty) || addQty <= 0) return;
    const nowTime = getNowDateTime();

    const nextStocks = stocks.map((s) => s.id === item.id ? { ...s, stock: s.stock + addQty } : s);
    setStocks(nextStocks);
    await persistInventory(nextStocks);
    const newRestock: RestockRecord = {
      id: Date.now().toString() + Math.random(),
      itemName: item.name,
      quantityAdded: addQty,
      date: nowTime,
    };
    const nextRestocks = [newRestock, ...restocks];
    setRestocks(nextRestocks);
    await saveAdminData({ restocks: nextRestocks });

    setInlineRestockValues({ ...inlineRestockValues, [item.id]: "" });
  };

  const handleSaveRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockItem || !restockQty || !restockDate) return;
    const qty = Number(restockQty);
    const stamp =
      phDateString(restockDate) === getTodayDate()
        ? getNowDateTime()
        : `${phDateString(restockDate)} 12:00:00`;

    if (editRestockId) {
      const previous = restocks.find((record) => record.id === editRestockId);
      const nextRestocks = restocks.map((r) =>
        r.id === editRestockId ? { ...r, itemName: restockItem, quantityAdded: qty, date: stamp } : r,
      );
      let nextStocks = stocks;
      if (previous) {
        nextStocks = stocks.map((item) => {
          let stock = item.stock;
          if (namesMatch(item.name, previous.itemName)) {
            stock = Math.max(0, stock - previous.quantityAdded);
          }
          if (namesMatch(item.name, restockItem)) {
            stock += qty;
          }
          return { ...item, stock };
        });
      }
      setRestocks(nextRestocks);
      setStocks(nextStocks);
      await saveAdminData({ restocks: nextRestocks });
      await persistInventory(nextStocks);
      setEditRestockId(null);
    } else {
      const newRestock: RestockRecord = { id: Date.now().toString(), itemName: restockItem, quantityAdded: qty, date: stamp };
      const nextRestocks = [newRestock, ...restocks];
      const nextStocks = stocks.map((s) =>
        namesMatch(s.name, restockItem) ? { ...s, stock: s.stock + qty } : s,
      );
      setRestocks(nextRestocks);
      setStocks(nextStocks);
      await saveAdminData({ restocks: nextRestocks });
      await persistInventory(nextStocks);
    }
    setRestockItem(""); setRestockQty(""); setRestockDate(getTodayDate());
  };

  const handleEditRestock = (r: RestockRecord) => {
    setEditRestockId(r.id);
    setRestockItem(r.itemName);
    setRestockQty(r.quantityAdded.toString());
    setRestockDate(phDateString(r.date));
  };

  const handleDeleteRestock = async (id: string) => {
    const record = restocks.find((item) => item.id === id);
    if (record) {
      const nextStocks = stocks.map((item) =>
        namesMatch(item.name, record.itemName)
          ? { ...item, stock: Math.max(0, item.stock - record.quantityAdded) }
          : item,
      );
      setStocks(nextStocks);
      await persistInventory(nextStocks);
    }
    setRestocks((current) => current.filter((s) => s.id !== id));
    await deleteAdminRecord("restock", id);
  };

  const handleSaveCosting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!costingProduct) return;

    if (editCostingId) {
      const nextCostings = costings.map((c) => c.id === editCostingId ? { ...c, productName: costingProduct, ingredients: costingIngs } : c);
      setCostings(nextCostings);
      await saveAdminData({ costings: nextCostings });
      setEditCostingId(null);
    } else {
      const newCosting: CostingItem = { id: Date.now().toString(), productName: costingProduct, ingredients: costingIngs };
      const nextCostings = [...costings, newCosting];
      setCostings(nextCostings);
      await saveAdminData({ costings: nextCostings });
    }
    setCostingProduct("");
    setCostingIngs([{ name: "", amount: 0, unit: "", outputCups: 0 }]);
  };

  const handleEditCosting = (c: CostingItem) => {
    setEditCostingId(c.id);
    setCostingProduct(c.productName);
    setCostingIngs(c.ingredients);
  };

  const handleDeleteCosting = async (id: string) => {
    setCostings((current) => current.filter((c) => c.id !== id));
    await deleteAdminRecord("costing", id);
  };

  const filteredTransactions = transactions.filter((t) => {
    const matchesKw = t.productName.toLowerCase().includes(filterKeyword.toLowerCase());
    const matchesTp = filterType === "All" || t.type === filterType;
    const matchesDate = !selectedDateFilter || t.date === selectedDateFilter;
    return matchesKw && matchesTp && matchesDate;
  });

  const filteredUsages = usages.filter((u) => {
    const matchesKw = u.itemName.toLowerCase().includes(filterKeyword.toLowerCase());
    const matchesDate = !selectedDateFilter || phDateString(u.date) === selectedDateFilter;
    return matchesKw && matchesDate;
  });

  return (
    <div className="min-h-screen min-w-0 space-y-6 rounded-none border-0 border-neutral-300 bg-white p-3 sm:rounded-xl sm:border sm:p-6">
      <div className="flex gap-2 overflow-x-auto border-b border-neutral-400 pb-3">
        {(["transactions", "stock", "restock", "costing", "used"] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`shrink-0 px-4 py-1.5 rounded text-xs font-bold transition shadow-sm uppercase ${activeTab === tab ? "bg-black text-white" : "bg-white text-neutral-700 hover:bg-neutral-100"}`}
          >
            {tab === "transactions" ? "Transactions" : tab === "stock" ? "Stock Inventory" : tab === "restock" ? "Restock" : tab === "costing" ? "Costing" : "Usage Logbook"}
          </button>
        ))}
      </div>

      {activeTab === "transactions" && (
        <div className="space-y-6">
          <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-400 shadow-sm space-y-4">
            <div className="text-xs font-bold text-neutral-700 uppercase tracking-wide border-b border-neutral-300 pb-1">
              {editTxId ? "Edit Transaction" : "New Transaction"}
            </div>
            <form onSubmit={handleSaveTransaction} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4 items-end">
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Date</label>
                <input type="date" value={txDate} onChange={(e) => setTxDate(e.target.value)} className="w-full bg-white border border-neutral-400 rounded px-3 py-1.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Product Name</label>
                <input type="text" placeholder="e.g. Iced Latte" value={txProduct} onChange={(e) => setTxProduct(e.target.value)} className="w-full bg-white border border-neutral-400 rounded px-3 py-1.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Quantity</label>
                <input type="number" placeholder="0" value={txQty} onChange={(e) => setTxQty(e.target.value)} className="w-full bg-white border border-neutral-400 rounded px-3 py-1.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Type</label>
                <select value={txType} onChange={(e) => setTxType(e.target.value as "Purchase" | "Sale")} className="w-full bg-white border border-neutral-400 rounded px-3 py-1.5 text-sm">
                  <option value="Sale">Sale</option>
                  <option value="Purchase">Purchase</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Price</label>
                <input type="number" step="0.01" placeholder="0.00" value={txPrice} onChange={(e) => setTxPrice(e.target.value)} className="w-full bg-white border border-neutral-400 rounded px-3 py-1.5 text-sm" />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-black text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-neutral-800">{editTxId ? "Update" : "Save"}</button>
                <button type="button" onClick={() => { setEditTxId(null); setTxProduct(""); setTxQty(""); setTxPrice(""); setTxDate(getTodayDate()); }} className="border border-neutral-300 bg-white text-black hover:bg-neutral-100 px-3 py-1.5 rounded text-sm font-medium">Clear</button>
              </div>
            </form>
          </div>

          <div className="flex flex-wrap gap-4 items-center bg-neutral-50 p-3 rounded-lg border border-neutral-400 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-600">Filter Date:</span>
              <input type="date" value={selectedDateFilter} onChange={(e) => setSelectedDateFilter(e.target.value)} className="bg-white border border-neutral-400 rounded px-2 py-1 text-xs" />
              {selectedDateFilter && <button onClick={() => setSelectedDateFilter("")} className="text-xs text-black underline">Reset</button>}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-600">Type:</span>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="bg-white border border-neutral-400 rounded px-2 py-1 text-xs">
                <option value="All">All</option>
                <option value="Sale">Sale</option>
                <option value="Purchase">Purchase</option>
              </select>
            </div>
            <div className="flex min-w-0 w-full items-center gap-2 sm:flex-1">
              <span className="shrink-0 text-xs text-neutral-600">Search:</span>
              <input type="text" placeholder="Search product..." value={filterKeyword} onChange={(e) => setFilterKeyword(e.target.value)} className="min-w-0 flex-1 bg-white border border-neutral-400 rounded px-2 py-1 text-xs sm:max-w-xs" />
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-neutral-400 bg-white shadow-sm">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="bg-black border-b border-black text-white font-semibold text-xs">
                  <th className="p-3 border-r border-white/15">Date</th>
                  <th className="p-3 border-r border-white/15">Product Name</th>
                  <th className="p-3 border-r border-white/15">Type</th>
                  <th className="p-3 border-r border-white/15 text-right">Quantity</th>
                  <th className="p-3 border-r border-white/15 text-right">Price</th>
                  <th className="p-3 border-r border-white/15 text-right">Amount</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length === 0 ? (
                  <tr><td colSpan={7} className="p-4 text-center text-neutral-500 text-xs">No transactions found for this date.</td></tr>
                ) : (
                  filteredTransactions.map((t) => (
                    <tr key={t.id} className="border-b border-neutral-200 hover:bg-neutral-50 text-xs">
                      <td className="p-3 border-r border-neutral-200 text-neutral-600 font-medium whitespace-nowrap">
                        {phDateTimeLabel(t.createdAt)}
                      </td>
                      <td className="p-3 border-r border-neutral-200 font-medium">{t.productName}</td>
                      <td className={`p-3 border-r border-neutral-200 font-semibold ${t.type === "Purchase" ? "text-neutral-500" : "text-black"}`}>{t.type}</td>
                      <td className="p-3 border-r border-neutral-200 text-right">{t.quantity}</td>
                      <td className="p-3 border-r border-neutral-200 text-right">₱{t.price.toFixed(2)}</td>
                      <td className="p-3 border-r border-neutral-200 text-right font-semibold">₱{t.amount.toFixed(2)}</td>
                      <td className="p-3 text-center space-x-2">
                        <button onClick={() => handleEditTransaction(t)} className="text-black hover:underline font-medium text-xs">Edit</button>
                        <button onClick={() => handleDeleteTransaction(t.id)} className="text-red-600 hover:underline font-medium text-xs">Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "stock" && (
        <div className="space-y-6">
          {stockNotice ? <p className="text-sm text-red-600">{stockNotice}</p> : null}
          <div className="flex flex-wrap gap-3 bg-neutral-50 p-3 rounded-lg border border-neutral-400 text-sm">
            <label className="text-xs text-neutral-600">Filter date:</label>
            <input type="date" value={selectedDateFilter} onChange={(e) => setSelectedDateFilter(e.target.value)} className="bg-white border border-neutral-400 rounded px-2 py-1 text-xs" />
            {selectedDateFilter && <button onClick={() => setSelectedDateFilter("")} className="text-xs text-black underline">Reset</button>}
          </div>
          <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-400 space-y-4">
            <h3 className="text-xs font-bold text-neutral-700 uppercase">{editStockId ? "Edit Stock Item" : "Add Stock Item"}</h3>
            <form onSubmit={handleSaveStock} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end">
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Item Name</label>
                <input type="text" placeholder="e.g. Coffee Beans" value={stockName} onChange={(e) => setStockName(e.target.value)} className="w-full bg-white border border-neutral-400 rounded px-3 py-1.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Category</label>
                <input type="text" placeholder="e.g. Ingredients" value={stockCategory} onChange={(e) => setStockCategory(e.target.value)} className="w-full bg-white border border-neutral-400 rounded px-3 py-1.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Quantity</label>
                <input type="number" placeholder="0" value={stockQty} onChange={(e) => setStockQty(e.target.value)} className="w-full bg-white border border-neutral-400 rounded px-3 py-1.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Unit</label>
                <input type="text" placeholder="grams, ml, pcs" value={stockUnit} onChange={(e) => setStockUnit(e.target.value)} className="w-full bg-white border border-neutral-400 rounded px-3 py-1.5 text-sm" />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-black text-white px-4 py-1.5 rounded text-sm font-medium">{editStockId ? "Update" : "Add"}</button>
                <button type="button" onClick={() => { setEditStockId(null); setStockName(""); setStockCategory(""); setStockQty(""); setStockUnit("grams"); }} className="border border-neutral-300 bg-white text-black hover:bg-neutral-100 px-4 py-1.5 rounded text-sm font-medium">Clear</button>
              </div>
            </form>
          </div>

          <div className="overflow-x-auto rounded-lg border border-neutral-400 bg-white">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead>
                <tr className="bg-black border-b border-black text-white text-xs font-semibold">
                  <th className="p-3 border-r border-white/15">Item</th>
                  <th className="p-3 border-r border-white/15">Unit</th>
                  <th className="p-3 border-r border-white/15 text-right">Opening</th>
                  <th className="p-3 border-r border-white/15 text-right">Restock</th>
                  <th className="p-3 border-r border-white/15 text-right">Used</th>
                  <th className="p-3 border-r border-white/15 text-right">Remaining</th>
                  <th className="p-3 border-r border-white/15 text-right">Cups left</th>
                  <th className="p-3 border-r border-white/15 text-center">Restock</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stocks.map((s) => {
                  const currentDateStr = selectedDateFilter || getTodayDate();
                  const { opening, restocked, used, remaining } = stockLedgerForDate({
                    itemName: s.name,
                    liveStock: s.stock,
                    date: currentDateStr,
                    restocks,
                    usages,
                  });
                  const isLiveDate = currentDateStr === getTodayDate();
                  const recipe = costingIngredientForItem(costings, s.name);
                  const cupsLeft = recipe ? cupsFromQuantity(remaining, recipe) : null;

                  return (
                    <tr key={s.id} className="border-b border-neutral-200 text-xs">
                      <td className="p-3 border-r border-neutral-200 font-medium">{s.name}</td>
                      <td className="p-3 border-r border-neutral-200 text-neutral-600">{s.unit}</td>
                      <td className="p-3 border-r border-neutral-200 text-right">{opening.toFixed(2)}</td>
                      <td className="p-3 border-r border-neutral-200 text-right font-semibold text-black">
                        {restocked > 0 ? `+${restocked}` : 0}
                      </td>
                      <td className="p-2 border-r border-neutral-200 text-right text-red-600 font-medium">
                        <input
                          aria-label={`Used stock for ${s.name}`}
                          type="number"
                          min="0"
                          value={used}
                          readOnly={!isLiveDate}
                          onChange={(e) => handleTotalUsedChange(s.name, e.target.value)}
                          className="w-24 bg-white border border-neutral-400 rounded px-2 py-1 text-right text-red-600 font-medium"
                        />
                      </td>
                      <td className="p-2 border-r border-neutral-200 text-right font-bold">
                        <input
                          aria-label={`Remaining stock for ${s.name}`}
                          type="number"
                          min="0"
                          value={remaining}
                          readOnly={!isLiveDate}
                          onChange={(e) => {
                            if (!isLiveDate) return;
                            const nextStock = Math.max(0, Number(e.target.value) || 0);
                            setStocks((currentStocks) =>
                              currentStocks.map((item) => item.id === s.id ? { ...item, stock: nextStock } : item),
                            );
                          }}
                          onBlur={(e) => {
                            if (!isLiveDate) return;
                            const nextStock = Math.max(0, Number(e.target.value) || 0);
                            const nextStocks = stocksRef.current.map((item) =>
                              item.id === s.id ? { ...item, stock: nextStock } : item,
                            );
                            setStocks(nextStocks);
                            void persistInventory(nextStocks);
                          }}
                          className="w-24 bg-white border border-neutral-400 rounded px-2 py-1 text-right font-bold"
                        />
                      </td>
                      <td className="p-3 border-r border-neutral-200 text-right text-neutral-600">
                        {cupsLeft == null ? "—" : `${cupsLeft.toFixed(1)} cups`}
                      </td>
                      <td className="p-3 border-r border-neutral-200 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            placeholder="+Qty"
                            value={inlineRestockValues[s.id] || ""}
                            onChange={(e) => setInlineRestockValues({ ...inlineRestockValues, [s.id]: e.target.value })}
                            className="w-20 bg-white border border-neutral-400 rounded px-2 py-1 text-xs text-right"
                          />
                          <button
                            type="button"
                            onClick={() => handleInlineRestock(s)}
                            className="bg-black hover:bg-neutral-800 text-white px-2.5 py-1 rounded text-xs font-medium"
                          >
                            Add
                          </button>
                        </div>
                      </td>
                      <td className="p-3 text-center space-x-2">
                        <button type="button" onClick={() => handleEditStock(s)} className="text-black hover:underline font-medium text-xs">Edit</button>
                        <button
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => void handleDeleteStock(s.id)}
                          className="text-red-600 hover:underline font-medium text-xs"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "restock" && (
        <div className="space-y-6">
          <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-400 space-y-4">
            <h3 className="text-xs font-bold text-neutral-700 uppercase">{editRestockId ? "Edit Restock Record" : "Add Restock Record"}</h3>
            <form onSubmit={handleSaveRestock} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Restock Date</label>
                <input type="date" value={restockDate} onChange={(e) => setRestockDate(e.target.value)} className="w-full bg-white border border-neutral-400 rounded px-3 py-1.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Item Name</label>
                <input type="text" placeholder="e.g. Coffee Beans" value={restockItem} onChange={(e) => setRestockItem(e.target.value)} className="w-full bg-white border border-neutral-400 rounded px-3 py-1.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Quantity Added</label>
                <input type="number" placeholder="0" value={restockQty} onChange={(e) => setRestockQty(e.target.value)} className="w-full bg-white border border-neutral-400 rounded px-3 py-1.5 text-sm" />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-black text-white px-3 py-1.5 rounded text-sm font-medium">{editRestockId ? "Update" : "Add"}</button>
                <button type="button" onClick={() => { setEditRestockId(null); setRestockItem(""); setRestockQty(""); setRestockDate(getTodayDate()); }} className="border border-neutral-300 bg-white text-black hover:bg-neutral-100 px-3 py-1.5 rounded text-sm font-medium">Clear</button>
              </div>
            </form>
          </div>

          <div className="overflow-x-auto rounded-lg border border-neutral-400 bg-white">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="bg-black border-b border-black text-white text-xs font-semibold">
                  <th className="p-3 border-r border-white/15">Date & Time</th>
                  <th className="p-3 border-r border-white/15">Item Name</th>
                  <th className="p-3 border-r border-white/15 text-right">Added Qty</th>
                  <th className="p-3 border-r border-white/15">Unit</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const filteredRestocks = restocks.filter((r) => !selectedDateFilter || phDateString(r.date) === selectedDateFilter);
                  if (selectedDateFilter && filteredRestocks.length === 0) {
                    return <tr><td colSpan={5} className="p-8 text-center text-sm text-neutral-500">No restock data for {selectedDateFilter}.</td></tr>;
                  }
                  return filteredRestocks.map((r) => (
                  <tr key={r.id} className="border-b border-neutral-200 text-xs">
                    <td className="p-3 border-r border-neutral-200 text-neutral-600 font-medium">{r.date}</td>
                    <td className="p-3 border-r border-neutral-200 font-medium">{r.itemName}</td>
                    <td className="p-3 border-r border-neutral-200 text-right font-bold text-black">+{r.quantityAdded}</td>
                    <td className="p-3 border-r border-neutral-200 text-neutral-600">
                      {stocks.find((item) => namesMatch(item.name, r.itemName))?.unit || ""}
                    </td>
                    <td className="p-3 text-center space-x-2">
                      <button onClick={() => handleEditRestock(r)} className="text-black hover:underline font-medium text-xs">Edit</button>
                      <button onClick={() => handleDeleteRestock(r.id)} className="text-red-600 hover:underline font-medium text-xs">Delete</button>
                    </td>
                  </tr>
                                  ))
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "costing" && (
        <div className="space-y-6">
          <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-400 space-y-4">
            <h3 className="text-xs font-bold text-neutral-700 uppercase">{editCostingId ? "Edit Costing Config" : "Configure Product Costing & Ingredients"}</h3>
            <form onSubmit={handleSaveCosting} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Product Name</label>
                  <input type="text" placeholder="e.g. Iced Latte" value={costingProduct} onChange={(e) => setCostingProduct(e.target.value)} className="w-full bg-white border border-neutral-400 rounded px-3 py-1.5 text-sm" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-neutral-600">
                  Recipe yield: pack amount and how many cups that pack makes. Per cup is calculated automatically.
                </label>
                {costingIngs.map((ing, idx) => (
                  <div key={idx} className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                    <input type="text" placeholder="Ingredient Name (e.g. Coffee Beans)" value={ing.name} onChange={(e) => {
                      const updated = [...costingIngs];
                      updated[idx].name = e.target.value;
                      setCostingIngs(updated);
                    }} className="col-span-2 flex-1 bg-white border border-neutral-400 rounded px-3 py-1.5 text-sm" />
                    <input type="number" min="0" step="0.01" placeholder="Pack amount" value={ing.amount || ""} onChange={(e) => {
                      const updated = [...costingIngs];
                      updated[idx].amount = Number(e.target.value);
                      setCostingIngs(updated);
                    }} className="w-full sm:w-24 bg-white border border-neutral-400 rounded px-3 py-1.5 text-sm" />
                      <input type="text" placeholder="Unit" value={ing.unit} onChange={(e) => {
                      const updated = [...costingIngs];
                      updated[idx].unit = e.target.value;
                      setCostingIngs(updated);
                    }} className="w-full sm:w-28 bg-white border border-neutral-400 rounded px-3 py-1.5 text-sm" />
                    <input type="number" min="0" step="0.01" placeholder="Cups produced" value={ing.outputCups || ""} onChange={(e) => {
                      const updated = [...costingIngs];
                      updated[idx].outputCups = Number(e.target.value);
                      setCostingIngs(updated);
                    }} className="w-full sm:w-28 bg-white border border-neutral-400 rounded px-3 py-1.5 text-sm" aria-label="Cups produced" />
                    <button type="button" onClick={() => setCostingIngs(costingIngs.filter((_, i) => i !== idx))} className="text-red-600 text-xs px-2 py-1.5 text-left sm:text-center">Remove</button>
                  </div>
                ))}
                <button type="button" onClick={() => setCostingIngs([...costingIngs, { name: "", amount: 0, unit: "", outputCups: 0 }])} className="text-xs border border-neutral-300 bg-white text-black hover:bg-neutral-100 px-3 py-1 rounded">
                  + Add Ingredient
                </button>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" className="bg-black text-white px-4 py-1.5 rounded text-sm font-medium">{editCostingId ? "Update Costing" : "Save Costing"}</button>
                <button type="button" onClick={() => { setEditCostingId(null); setCostingProduct(""); setCostingIngs([{ name: "", amount: 0, unit: "", outputCups: 0 }]); }} className="border border-neutral-300 bg-white text-black hover:bg-neutral-100 px-4 py-1.5 rounded text-sm font-medium">Clear</button>
              </div>
            </form>
          </div>

          <div className="overflow-x-auto rounded-lg border border-neutral-400 bg-white">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead>
                <tr className="bg-black border-b border-black text-white text-xs font-semibold">
                  <th className="p-3 border-r border-white/15">Item</th>
                  <th className="p-3 border-r border-white/15">Pack recipe</th>
                  <th className="p-3 border-r border-white/15">Per cup</th>
                  <th className="p-3 border-r border-white/15 text-right">Used today</th>
                  <th className="p-3 border-r border-white/15 text-right">Stock</th>
                  <th className="p-3 border-r border-white/15 text-right">Cups left</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {costings.map((c) => {
                  const ing = c.ingredients[0];
                  const stock = stocks.find((item) => namesMatch(item.name, c.productName) || (ing ? namesMatch(item.name, ing.name) : false));
                  const remaining = stock?.stock ?? 0;
                  const used = usages
                    .filter((entry) => phDateString(entry.date) === (selectedDateFilter || getTodayDate()))
                    .filter((entry) => namesMatch(entry.itemName, c.productName) || (ing ? namesMatch(entry.itemName, ing.name) : false))
                    .reduce((sum, entry) => sum + entry.usedAmount, 0);
                  const perCup = ing ? perCupAmount(ing) : 0;
                  const cupsLeft = ing ? cupsFromQuantity(remaining, ing) : 0;
                  const cupsUsed = ing ? cupsFromQuantity(used, ing) : 0;
                  return (
                    <tr key={c.id} className="border-b border-neutral-200 text-xs">
                      <td className="p-3 border-r border-neutral-200 font-medium">{c.productName}</td>
                      <td className="p-3 border-r border-neutral-200">
                        {ing ? `${ing.amount} ${ing.unit} → ${ing.outputCups ?? 0} cups` : "—"}
                      </td>
                      <td className="p-3 border-r border-neutral-200">
                        {ing && perCup > 0 ? `${perCup.toFixed(2)} ${ing.unit}` : "—"}
                      </td>
                      <td className="p-3 border-r border-neutral-200 text-right text-red-600">
                        {used} {ing?.unit} ({cupsUsed.toFixed(1)} cups)
                      </td>
                      <td className="p-3 border-r border-neutral-200 text-right">
                        {remaining} {stock?.unit || ing?.unit}
                      </td>
                      <td className="p-3 border-r border-neutral-200 text-right font-semibold">
                        {cupsLeft.toFixed(1)} cups
                      </td>
                      <td className="p-3 text-center space-x-2">
                        <button onClick={() => handleEditCosting(c)} className="text-black hover:underline font-medium text-xs">Edit</button>
                        <button onClick={() => handleDeleteCosting(c.id)} className="text-red-600 hover:underline font-medium text-xs">Delete</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "used" && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-3 bg-neutral-50 p-3 rounded-lg border border-neutral-400 text-sm">
            <label className="text-xs text-neutral-600">Filter date:</label>
            <input type="date" value={selectedDateFilter} onChange={(e) => setSelectedDateFilter(e.target.value)} className="bg-white border border-neutral-400 rounded px-2 py-1 text-xs" />
            {selectedDateFilter && <button onClick={() => setSelectedDateFilter("")} className="text-xs text-black underline">Reset</button>}
          </div>
          <div className="overflow-x-auto rounded-lg border border-neutral-400 bg-white">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="bg-black border-b border-black text-white text-xs font-semibold">
                  <th className="p-3 border-r border-white/15">Date</th>
                  <th className="p-3 border-r border-white/15">Item Name</th>
                  <th className="p-3 border-r border-white/15">Sold as</th>
                  <th className="p-3 border-r border-white/15 text-right">Used Amount</th>
                  <th className="p-3 border-r border-white/15 text-right">Remaining</th>
                  <th className="p-3 text-center">Unit</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsages.length === 0 ? (
                  <tr><td colSpan={6} className="p-4 text-center text-neutral-500 text-xs">No usage records found.</td></tr>
                ) : (
                  filteredUsages.map((u, index) => (
                    <tr key={`${u.id}-${index}`} className="border-b border-neutral-200 text-xs">
                      <td className="p-3 border-r border-neutral-200 text-neutral-600 font-medium whitespace-nowrap">{phDateTimeLabel(u.date)}</td>
                      <td className="p-3 border-r border-neutral-200 font-medium">{u.itemName}</td>
                      <td className="p-3 border-r border-neutral-200 text-neutral-600">{u.soldAs || "—"}</td>
                      <td className="p-3 border-r border-neutral-200 text-right font-bold text-red-600">-{formatQty(u.usedAmount)}</td>
                      <td className="p-3 border-r border-neutral-200 text-right font-semibold">{formatQty(u.remaining)}</td>
                      <td className="p-3 text-center text-neutral-600">{u.unit}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}