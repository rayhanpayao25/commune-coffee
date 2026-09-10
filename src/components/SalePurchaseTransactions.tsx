import { useEffect, useState } from "react";
import { deleteAdminRecord, saveAdminData } from "@/actions/pos";
import type { StoreData } from "@/lib/types";

type TabType = "transactions" | "stock" | "restock" | "costing" | "used";

type Transaction = {
  id: string;
  productName: string;
  type: "Purchase" | "Sale";
  quantity: number;
  price: number;
  amount: number;
  date: string;
};

type StockItem = {
  id: string;
  name: string;
  category: string;
  stock: number;
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
};

export function SalePurchaseTransactions({ store }: { store: StoreData }) {
  const [activeTab, setActiveTab] = useState<TabType>("transactions");
  const persistedTransactions: Transaction[] = store.orders.map((order) => ({
    id: order.id,
    productName: order.items.map((item) => `${item.qty}x ${item.name}`).join(", "),
    type: "Sale",
    quantity: order.items.reduce((sum, item) => sum + item.qty, 0),
    price: order.total,
    amount: order.total,
    date: order.createdAt.slice(0, 10),
  }));
  const persistedStocks: StockItem[] = store.inventory.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    stock: item.stock,
  }));
  const persistedUsages: UsageRecord[] = store.usageLogs.map((entry) => ({
    id: entry.id,
    date: entry.date,
    itemName: entry.itemName,
    usedAmount: entry.usedAmount,
    unit: entry.unit,
  }));

  const getTodayDate = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getNowDateTime = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const seconds = String(d.getSeconds()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  const [transactions, setTransactions] = useState<Transaction[]>(persistedTransactions);

  const [stocks, setStocks] = useState<StockItem[]>(persistedStocks);

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

  const [filterType, setFilterType] = useState("All");
  const [filterKeyword, setFilterKeyword] = useState("");
  const [selectedDateFilter, setSelectedDateFilter] = useState("");

  const handleTotalUsedChange = (itemName: string, value: string) => {
    const nextTotal = Math.max(0, Number(value) || 0);
    setUsages((currentUsages) => {
      const matching = currentUsages.filter((usage) => usage.itemName.toLowerCase() === itemName.toLowerCase());
      if (matching.length === 0) {
        return nextTotal === 0
          ? currentUsages
          : [{ id: Date.now().toString(), date: getTodayDate(), itemName, usedAmount: nextTotal, unit: "units" }, ...currentUsages];
      }

      const firstId = matching[0].id;
      const otherUsageTotal = matching.slice(1).reduce((sum, usage) => sum + usage.usedAmount, 0);
      return currentUsages.map((usage) =>
        usage.id === firstId
          ? { ...usage, usedAmount: Math.max(0, nextTotal - otherUsageTotal) }
          : usage,
      );
    });
  };

  const applyTransactionInventoryEffect = (productName: string, type: "Purchase" | "Sale", quantity: number, dateStr: string, isRevert = false) => {
    setStocks((prevStocks) => {
      const updatedStocks = [...prevStocks];
      
      if (type === "Sale") {
        const costing = costings.find((c) => c.productName.toLowerCase() === productName.toLowerCase());
        if (costing) {
          costing.ingredients.forEach((ing) => {
            const stockIndex = updatedStocks.findIndex((s) => s.name.toLowerCase() === ing.name.toLowerCase());
            if (stockIndex !== -1) {
              const totalUsed = ing.amount * quantity;
              updatedStocks[stockIndex].stock = isRevert
                ? updatedStocks[stockIndex].stock + totalUsed
                : updatedStocks[stockIndex].stock - totalUsed;

              if (!isRevert) {
                setUsages((prevUsages) => [
                  {
                    id: Date.now().toString() + Math.random(),
                    date: dateStr,
                    itemName: ing.name,
                    usedAmount: totalUsed,
                    unit: ing.unit,
                  },
                  ...prevUsages,
                ]);
              }
            }
          });
        }
      } else if (type === "Purchase") {
        const stockIndex = updatedStocks.findIndex((s) => s.name.toLowerCase() === productName.toLowerCase());
        if (stockIndex !== -1) {
          updatedStocks[stockIndex].stock = isRevert
            ? updatedStocks[stockIndex].stock - quantity
            : updatedStocks[stockIndex].stock + quantity;
        }
      }
      return updatedStocks;
    });
  };

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txProduct || !txQty || !txPrice || !txDate) return;
    const qty = Number(txQty);
    const prc = Number(txPrice);

    if (editTxId) {
      const oldTx = transactions.find((t) => t.id === editTxId);
      if (oldTx) {
        applyTransactionInventoryEffect(oldTx.productName, oldTx.type, oldTx.quantity, oldTx.date, true);
        setUsages((prev) => prev.filter(u => u.date !== oldTx.date));
      }
      setTransactions(transactions.map((t) => t.id === editTxId ? { ...t, productName: txProduct, type: txType, quantity: qty, price: prc, amount: qty * prc, date: txDate } : t));
      applyTransactionInventoryEffect(txProduct, txType, qty, txDate, false);
      setEditTxId(null);
    } else {
      const newTx: Transaction = { id: Date.now().toString(), productName: txProduct, type: txType, quantity: qty, price: prc, amount: qty * prc, date: txDate };
      setTransactions([newTx, ...transactions]);
      applyTransactionInventoryEffect(txProduct, txType, qty, txDate, false);
    }
    setTxProduct(""); setTxQty(""); setTxPrice(""); setTxDate(getTodayDate());
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
    if (tx) applyTransactionInventoryEffect(tx.productName, tx.type, tx.quantity, tx.date, true);
    setTransactions((current) => current.filter((t) => t.id !== id));
    await deleteAdminRecord("order", id);
  };

  const handleSaveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockName || !stockCategory || !stockQty) return;
    const qty = Number(stockQty);
    const nowTime = getNowDateTime();

    if (editStockId) {
      setStocks(stocks.map((s) => s.id === editStockId ? { ...s, name: stockName, category: stockCategory, stock: qty } : s));
      const nextStocks = stocks.map((s) => s.id === editStockId ? { ...s, name: stockName, category: stockCategory, stock: qty } : s);
      setStocks(nextStocks);
      await saveAdminData({
        inventory: store.inventory.map((item) => {
          const next = nextStocks.find((stock) => stock.id === item.id);
          return next ? { ...item, name: next.name, category: next.category, stock: next.stock } : item;
        }),
      });
      setEditStockId(null);
    } else {
      const newItem: StockItem = { id: Date.now().toString(), name: stockName, category: stockCategory, stock: qty };
      const nextStocks = [...stocks, newItem];
      setStocks(nextStocks);
      await saveAdminData({
        inventory: [...store.inventory, { id: newItem.id, name: newItem.name, category: newItem.category, stock: newItem.stock, unit: "pcs", cost: 0, maxStock: newItem.stock }],
      });

      const newRestock: RestockRecord = {
        id: Date.now().toString() + Math.random(),
        itemName: stockName,
        quantityAdded: qty,
        date: nowTime,
      };
      setRestocks([newRestock, ...restocks]);
    }
    setStockName(""); setStockCategory(""); setStockQty("");
  };

  const handleEditStock = (s: StockItem) => {
    setEditStockId(s.id);
    setStockName(s.name);
    setStockCategory(s.category);
    setStockQty(s.stock.toString());
  };

  const handleDeleteStock = async (id: string) => {
    setStocks((current) => current.filter((s) => s.id !== id));
    await deleteAdminRecord("inventory", id);
  };

  const handleInlineRestock = async (item: StockItem) => {
    const amountStr = inlineRestockValues[item.id];
    if (!amountStr) return;
    const addQty = Number(amountStr);
    if (isNaN(addQty) || addQty <= 0) return;
    const nowTime = getNowDateTime();

    const nextStocks = stocks.map((s) => s.id === item.id ? { ...s, stock: s.stock + addQty } : s);
    setStocks(nextStocks);
    await saveAdminData({
      inventory: store.inventory.map((inventory) => {
        const next = nextStocks.find((stock) => stock.id === inventory.id);
        return next ? { ...inventory, stock: next.stock } : inventory;
      }),
    });

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
    const nowTime = getNowDateTime();

    if (editRestockId) {
      const nextRestocks = restocks.map((r) => r.id === editRestockId ? { ...r, itemName: restockItem, quantityAdded: qty, date: restockDate } : r);
      setRestocks(nextRestocks);
      await saveAdminData({ restocks: nextRestocks });
      setEditRestockId(null);
    } else {
      const newRestock: RestockRecord = { id: Date.now().toString(), itemName: restockItem, quantityAdded: qty, date: nowTime };
      const nextRestocks = [newRestock, ...restocks];
      setRestocks(nextRestocks);
      await saveAdminData({ restocks: nextRestocks });
      
      setStocks((prev) =>
        prev.map((s) => s.name.toLowerCase() === restockItem.toLowerCase() ? { ...s, stock: s.stock + qty } : s)
      );
    }
    setRestockItem(""); setRestockQty(""); setRestockDate(getTodayDate());
  };

  const handleEditRestock = (r: RestockRecord) => {
    setEditRestockId(r.id);
    setRestockItem(r.itemName);
    setRestockQty(r.quantityAdded.toString());
    setRestockDate(r.date);
  };

  const handleDeleteRestock = async (id: string) => {
    setRestocks((current) => current.filter((r) => r.id !== id));
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
    const matchesDate = !selectedDateFilter || u.date.startsWith(selectedDateFilter);
    return matchesKw && matchesDate;
  });

  return (
    <div className="min-h-screen min-w-0 space-y-6 rounded-none border-0 border-neutral-300 bg-[#e2f1f2] p-3 sm:rounded-xl sm:border sm:p-6">
      <div className="flex gap-2 overflow-x-auto border-b border-neutral-400 pb-3">
        {(["transactions", "stock", "restock", "costing", "used"] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`shrink-0 px-4 py-1.5 rounded text-xs font-bold transition shadow-sm uppercase ${activeTab === tab ? "bg-[#1b5e5a] text-white" : "bg-white text-neutral-700 hover:bg-neutral-100"}`}
          >
            {tab === "transactions" ? "Transactions" : tab === "stock" ? "Stock Inventory" : tab === "restock" ? "Restock" : tab === "costing" ? "Costing" : "Usage Logbook"}
          </button>
        ))}
      </div>

      {activeTab === "transactions" && (
        <div className="space-y-6">
          <div className="bg-[#d1e8e9] p-4 rounded-lg border border-neutral-400 shadow-sm space-y-4">
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
                <button type="submit" className="flex-1 bg-[#1b5e5a] text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-[#154a47]">{editTxId ? "Update" : "Save"}</button>
                <button type="button" onClick={() => { setEditTxId(null); setTxProduct(""); setTxQty(""); setTxPrice(""); setTxDate(getTodayDate()); }} className="bg-[#2d7a75] text-white px-3 py-1.5 rounded text-sm font-medium">Clear</button>
              </div>
            </form>
          </div>

          <div className="flex flex-wrap gap-4 items-center bg-[#d1e8e9] p-3 rounded-lg border border-neutral-400 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-600">Filter Date:</span>
              <input type="date" value={selectedDateFilter} onChange={(e) => setSelectedDateFilter(e.target.value)} className="bg-white border border-neutral-400 rounded px-2 py-1 text-xs" />
              {selectedDateFilter && <button onClick={() => setSelectedDateFilter("")} className="text-xs text-blue-600 underline">Reset</button>}
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
                <tr className="bg-[#b5d6d8] border-b border-neutral-400 text-neutral-800 font-semibold text-xs">
                  <th className="p-3 border-r border-neutral-300">Date</th>
                  <th className="p-3 border-r border-neutral-300">Product Name</th>
                  <th className="p-3 border-r border-neutral-300">Type</th>
                  <th className="p-3 border-r border-neutral-300 text-right">Quantity</th>
                  <th className="p-3 border-r border-neutral-300 text-right">Price</th>
                  <th className="p-3 border-r border-neutral-300 text-right">Amount</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length === 0 ? (
                  <tr><td colSpan={7} className="p-4 text-center text-neutral-500 text-xs">No transactions found for this date.</td></tr>
                ) : (
                  filteredTransactions.map((t) => (
                    <tr key={t.id} className="border-b border-neutral-200 hover:bg-neutral-50 text-xs">
                      <td className="p-3 border-r border-neutral-200 text-neutral-600 font-medium">{t.date}</td>
                      <td className="p-3 border-r border-neutral-200 font-medium">{t.productName}</td>
                      <td className={`p-3 border-r border-neutral-200 font-semibold ${t.type === "Purchase" ? "text-blue-700" : "text-green-700"}`}>{t.type}</td>
                      <td className="p-3 border-r border-neutral-200 text-right">{t.quantity}</td>
                      <td className="p-3 border-r border-neutral-200 text-right">₱{t.price.toFixed(2)}</td>
                      <td className="p-3 border-r border-neutral-200 text-right font-semibold">₱{t.amount.toFixed(2)}</td>
                      <td className="p-3 text-center space-x-2">
                        <button onClick={() => handleEditTransaction(t)} className="text-blue-600 hover:underline font-medium text-xs">Edit</button>
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
          <div className="flex flex-wrap gap-3 bg-[#d1e8e9] p-3 rounded-lg border border-neutral-400 text-sm">
            <label className="text-xs text-neutral-600">Filter date:</label>
            <input type="date" value={selectedDateFilter} onChange={(e) => setSelectedDateFilter(e.target.value)} className="bg-white border border-neutral-400 rounded px-2 py-1 text-xs" />
            {selectedDateFilter && <button onClick={() => setSelectedDateFilter("")} className="text-xs text-blue-600 underline">Reset</button>}
          </div>
          <div className="bg-[#d1e8e9] p-4 rounded-lg border border-neutral-400 space-y-4">
            <h3 className="text-xs font-bold text-neutral-700 uppercase">{editStockId ? "Edit Stock Item" : "Add Stock Item"}</h3>
            <form onSubmit={handleSaveStock} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
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
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-[#1b5e5a] text-white px-4 py-1.5 rounded text-sm font-medium">{editStockId ? "Update" : "Add"}</button>
                <button type="button" onClick={() => { setEditStockId(null); setStockName(""); setStockCategory(""); setStockQty(""); }} className="bg-[#2d7a75] text-white px-4 py-1.5 rounded text-sm font-medium">Clear</button>
              </div>
            </form>
          </div>

          <div className="overflow-x-auto rounded-lg border border-neutral-400 bg-white">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead>
                <tr className="bg-[#b5d6d8] border-b border-neutral-400 text-neutral-800 text-xs font-semibold">
                  <th className="p-3 border-r border-neutral-300">Date</th>
                  <th className="p-3 border-r border-neutral-300">Item Name</th>
                  <th className="p-3 border-r border-neutral-300">Category</th>
                  <th className="p-3 border-r border-neutral-300 text-right">Current Stock</th>
                  <th className="p-3 border-r border-neutral-300 text-right">Restock</th>
                  <th className="p-3 border-r border-neutral-300 text-right">Total Stock</th>
                  <th className="p-3 border-r border-neutral-300 text-right">Used Stock</th>
                  <th className="p-3 border-r border-neutral-300 text-right">Remaining Stock</th>
                  <th className="p-3 border-r border-neutral-300 text-center">Restock</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const hasSelectedDateData = !selectedDateFilter || store.orders.some((order) => order.createdAt.slice(0, 10) === selectedDateFilter) || restocks.some((record) => record.date.slice(0, 10) === selectedDateFilter) || usages.some((usage) => usage.date.slice(0, 10) === selectedDateFilter);
                  if (!hasSelectedDateData && selectedDateFilter) {
                    return <tr><td colSpan={10} className="p-8 text-center text-sm text-neutral-500">No stock data for {selectedDateFilter}.</td></tr>;
                  }
                  return stocks.map((s) => {
                  const isMatcha = /matcha/i.test(`${s.name} ${s.category}`);
                  
                  // Dito kinukuha ang petsa na sinusuri (selected date o kaya ay ngayon)
                  const currentDateStr = selectedDateFilter || getTodayDate();
                  
                  // Kwentahin ang nakaraang remaining stock kung ito ay lagpas na sa simula (Carry-over mula kahapon)
                  const previousDateStr = (() => {
                    if (!selectedDateFilter) return null;
                    const d = new Date(selectedDateFilter);
                    d.setDate(d.getDate() - 1);
                    return d.toISOString().slice(0, 10);
                  })();

                  // Base stock mula sa database o input item.stock
                  let effectiveCurrentStock = s.stock;

                  if (selectedDateFilter && previousDateStr) {
                    // Kalkulahin ang ending stock ng nakaraang araw para maging current stock ngayon
                    const prevRestocked = restocks
                      .filter((record) => record.itemName.toLowerCase() === s.name.toLowerCase() && record.date.slice(0, 10) <= previousDateStr)
                      .reduce((sum, record) => sum + record.quantityAdded, 0);
                    
                    const prevOrderUsed = isMatcha
                      ? store.orders.filter((order) => order.createdAt.slice(0, 10) <= previousDateStr).reduce((sum, order) => sum + order.items
                        .filter((item) => /matcha|hojicha/i.test(`${item.name} ${item.productId}`))
                        .reduce((itemSum, item) => itemSum + item.qty * 10, 0), 0)
                      : 0;
                    
                    const prevLoggedUsed = usages
                      .filter((u) => {
                        if (u.date.slice(0, 10) > previousDateStr) return false;
                        const usageName = u.itemName.toLowerCase();
                        const stockName = s.name.toLowerCase();
                        return usageName === stockName || usageName.includes(stockName) || stockName.includes(usageName);
                      })
                      .reduce((acc, curr) => acc + curr.usedAmount, 0);

                    const prevTotalUsed = isMatcha ? Math.max(prevOrderUsed, prevLoggedUsed) : prevLoggedUsed;
                    const packSize = isMatcha ? 150 : 1;
                    const prevTotalStock = (s.stock + prevRestocked) * packSize;
                    
                    // Remaining stock kahapon = Current + Restock - Used
                    effectiveCurrentStock = Math.max(0, prevTotalStock - prevTotalUsed) / packSize;
                  }

                  const orderUsed = isMatcha
                    ? store.orders.filter((order) => order.createdAt.slice(0, 10) === currentDateStr).reduce((sum, order) => sum + order.items
                      .filter((item) => /matcha|hojicha/i.test(`${item.name} ${item.productId}`))
                      .reduce((itemSum, item) => itemSum + item.qty * 10, 0), 0)
                    : 0;
                  
                  const loggedUsed = usages
                    .filter((u) => {
                      if (u.date.slice(0, 10) !== currentDateStr) return false;
                      const usageName = u.itemName.toLowerCase();
                      const stockName = s.name.toLowerCase();
                      return usageName === stockName || usageName.includes(stockName) || stockName.includes(usageName);
                    })
                    .reduce((acc, curr) => acc + curr.usedAmount, 0);

                  const totalUsed = isMatcha ? Math.max(orderUsed, loggedUsed) : loggedUsed;
                  
                  const totalRestocked = restocks
                    .filter((record) => record.itemName.toLowerCase() === s.name.toLowerCase() && record.date.slice(0, 10) === currentDateStr)
                    .reduce((sum, record) => sum + record.quantityAdded, 0);
                  
                  const packSize = isMatcha ? 150 : 1;
                  const totalStock = effectiveCurrentStock + totalRestocked;
                  const stockInBaseUnits = totalStock * packSize;
                  const remainingBaseUnits = Math.max(0, stockInBaseUnits - totalUsed);
                  const remainingPacks = isMatcha ? remainingBaseUnits / packSize : remainingBaseUnits;
                  const remainingCups = isMatcha ? remainingBaseUnits / 10 : 0;

                  return (
                    <tr key={s.id} className="border-b border-neutral-200 text-xs">
                      <td className="p-3 border-r border-neutral-200 text-neutral-600">{currentDateStr}</td>
                      <td className="p-3 border-r border-neutral-200 font-medium">{s.name}</td>
                      <td className="p-3 border-r border-neutral-200 text-neutral-600">{s.category}</td>
                      <td className="p-2 border-r border-neutral-200 text-right font-bold">
                        <input
                          aria-label={`Current Stock for ${s.name}`}
                          type="number"
                          min="0"
                          value={effectiveCurrentStock}
                          onChange={(e) => {
                            const nextStock = Math.max(0, Number(e.target.value) || 0);
                            setStocks((currentStocks) => currentStocks.map((item) => item.id === s.id ? { ...item, stock: nextStock } : item));
                          }}
                          className="w-24 bg-white border border-neutral-400 rounded px-2 py-1 text-right font-bold"
                        />
                      </td>
                      <td className="p-3 border-r border-neutral-200 text-right font-semibold">
                        {isMatcha ? `${totalRestocked} packs` : totalRestocked}
                      </td>
                      <td className="p-3 border-r border-neutral-200 text-right font-bold">
                        {isMatcha ? `${totalStock.toFixed(2)} packs (${stockInBaseUnits.toFixed(0)} g)` : stockInBaseUnits}
                      </td>
                      <td className="p-2 border-r border-neutral-200 text-right text-red-600 font-medium">
                        <input
                          aria-label={`Used Stock for ${s.name}`}
                          type="number"
                          min="0"
                          value={totalUsed}
                          onChange={(e) => handleTotalUsedChange(s.name, e.target.value)}
                          className="w-24 bg-white border border-neutral-400 rounded px-2 py-1 text-right text-red-600 font-medium"
                        />
                        {isMatcha && <span className="ml-1">g</span>}
                      </td>
                      <td className="p-3 border-r border-neutral-200 text-right font-bold">
                        {isMatcha
                          ? `${remainingPacks.toFixed(2)} packs (${remainingBaseUnits.toFixed(0)} g; ${remainingCups.toFixed(0)} cups)`
                          : remainingBaseUnits}
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
                            className="bg-[#1b5e5a] hover:bg-[#154a47] text-white px-2.5 py-1 rounded text-xs font-medium"
                          >
                            Add
                          </button>
                        </div>
                      </td>
                      <td className="p-3 text-center space-x-2">
                        <button onClick={() => handleEditStock(s)} className="text-blue-600 hover:underline font-medium text-xs">Edit</button>
                        <button onClick={() => handleDeleteStock(s.id)} className="text-red-600 hover:underline font-medium text-xs">Delete</button>
                      </td>
                    </tr>
                  );
                })})()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "restock" && (
        <div className="space-y-6">
          <div className="bg-[#d1e8e9] p-4 rounded-lg border border-neutral-400 space-y-4">
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
                <button type="submit" className="flex-1 bg-[#1b5e5a] text-white px-3 py-1.5 rounded text-sm font-medium">{editRestockId ? "Update" : "Add"}</button>
                <button type="button" onClick={() => { setEditRestockId(null); setRestockItem(""); setRestockQty(""); setRestockDate(getTodayDate()); }} className="bg-[#2d7a75] text-white px-3 py-1.5 rounded text-sm font-medium">Clear</button>
              </div>
            </form>
          </div>

          <div className="overflow-x-auto rounded-lg border border-neutral-400 bg-white">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="bg-[#b5d6d8] border-b border-neutral-400 text-neutral-800 text-xs font-semibold">
                  <th className="p-3 border-r border-neutral-300">Date & Time</th>
                  <th className="p-3 border-r border-neutral-300">Item Name</th>
                  <th className="p-3 border-r border-neutral-300 text-right">Added Qty</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const filteredRestocks = restocks.filter((r) => !selectedDateFilter || r.date.slice(0, 10) === selectedDateFilter);
                  if (selectedDateFilter && filteredRestocks.length === 0) {
                    return <tr><td colSpan={4} className="p-8 text-center text-sm text-neutral-500">No restock data for {selectedDateFilter}.</td></tr>;
                  }
                  return filteredRestocks.map((r) => (
                  <tr key={r.id} className="border-b border-neutral-200 text-xs">
                    <td className="p-3 border-r border-neutral-200 text-neutral-600 font-medium">{r.date}</td>
                    <td className="p-3 border-r border-neutral-200 font-medium">{r.itemName}</td>
                    <td className="p-3 border-r border-neutral-200 text-right font-bold text-blue-700">+{r.quantityAdded}</td>
                    <td className="p-3 text-center space-x-2">
                      <button onClick={() => handleEditRestock(r)} className="text-blue-600 hover:underline font-medium text-xs">Edit</button>
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
          <div className="bg-[#d1e8e9] p-4 rounded-lg border border-neutral-400 space-y-4">
            <h3 className="text-xs font-bold text-neutral-700 uppercase">{editCostingId ? "Edit Costing Config" : "Configure Product Costing & Ingredients"}</h3>
            <form onSubmit={handleSaveCosting} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Product Name</label>
                  <input type="text" placeholder="e.g. Iced Latte" value={costingProduct} onChange={(e) => setCostingProduct(e.target.value)} className="w-full bg-white border border-neutral-400 rounded px-3 py-1.5 text-sm" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-neutral-600">Ingredients Deducted per 1 Cup/Servings:</label>
                {costingIngs.map((ing, idx) => (
                  <div key={idx} className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                    <input type="text" placeholder="Ingredient Name (e.g. Coffee Beans)" value={ing.name} onChange={(e) => {
                      const updated = [...costingIngs];
                      updated[idx].name = e.target.value;
                      setCostingIngs(updated);
                    }} className="col-span-2 flex-1 bg-white border border-neutral-400 rounded px-3 py-1.5 text-sm" />
                    <input type="number" placeholder="Amount" value={ing.amount || ""} onChange={(e) => {
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
                <button type="button" onClick={() => setCostingIngs([...costingIngs, { name: "", amount: 0, unit: "", outputCups: 0 }])} className="text-xs bg-[#2d7a75] text-white px-3 py-1 rounded">
                  + Add Ingredient
                </button>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" className="bg-[#1b5e5a] text-white px-4 py-1.5 rounded text-sm font-medium">{editCostingId ? "Update Costing" : "Save Costing"}</button>
                <button type="button" onClick={() => { setEditCostingId(null); setCostingProduct(""); setCostingIngs([{ name: "", amount: 0, unit: "", outputCups: 0 }]); }} className="bg-[#2d7a75] text-white px-4 py-1.5 rounded text-sm font-medium">Clear</button>
              </div>
            </form>
          </div>

          <div className="overflow-x-auto rounded-lg border border-neutral-400 bg-white">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead>
                <tr className="bg-[#b5d6d8] border-b border-neutral-400 text-neutral-800 text-xs font-semibold">
                  <th className="p-3 border-r border-neutral-300">Date</th>
                  <th className="p-3 border-r border-neutral-300">Item</th>
                  <th className="p-3 border-r border-neutral-300">Cups</th>
                  <th className="p-3 border-r border-neutral-300">Used</th>
                  <th className="p-3 border-r border-neutral-300">Stock</th>
                  <th className="p-3 border-r border-neutral-300">Available</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const hasCostingDataForDate = !selectedDateFilter || store.orders.some((order) => order.createdAt.slice(0, 10) === selectedDateFilter) || restocks.some((record) => record.date.slice(0, 10) === selectedDateFilter) || usages.some((usage) => usage.date.slice(0, 10) === selectedDateFilter);
                  if (!hasCostingDataForDate) {
                    return <tr><td colSpan={7} className="p-8 text-center text-sm text-neutral-500">No costing data for {selectedDateFilter}.</td></tr>;
                  }
                  return costings.map((c) => (
                  <tr key={c.id} className="border-b border-neutral-200 text-xs">
                    {(() => {
                      const ing = c.ingredients[0];
                      const ingredientName = ing?.name.toLowerCase() ?? "";
                      const stock = stocks.find((item) => {
                        const itemName = item.name.toLowerCase();
                        return itemName === ingredientName || itemName.includes(ingredientName) || ingredientName.includes(itemName);
                      });
                      const isMatcha = /matcha/i.test(ingredientName) || /matcha powder/i.test(stock?.name ?? "");
                      const usedFromOrders = store.orders.filter((order) => !selectedDateFilter || order.createdAt.slice(0, 10) === selectedDateFilter).reduce((sum, order) =>
                        sum + order.items
                          .filter((item) => /matcha|hojicha/i.test(`${item.name} ${item.productId}`))
                          .reduce((itemSum, item) => itemSum + item.qty * 10, 0),
                        0,
                      );
                      const used = isMatcha
                        ? usedFromOrders
                        : usages
                          .filter((entry) => !selectedDateFilter || entry.date.slice(0, 10) === selectedDateFilter)
                          .filter((entry) => {
                            const entryName = entry.itemName.toLowerCase();
                            return entryName === ingredientName || entryName.includes(ingredientName) || ingredientName.includes(entryName);
                          })
                          .reduce((sum, entry) => sum + entry.usedAmount, 0);
                      const packSize = isMatcha ? 150 : 1;
                      const remainingStock = stock?.stock ?? 0;
                      const currentStock = remainingStock * packSize + used;
                      const available = Math.max(0, currentStock - used);
                      const cupsUsed = ing && ing.amount > 0 && ing.outputCups ? (used / ing.amount) * ing.outputCups : 0;
                      const cups = ing && ing.amount > 0 && ing.outputCups ? (available / ing.amount) * ing.outputCups : 0;
                      return <>
                        <td className="p-3 border-r border-neutral-200 text-neutral-600">{selectedDateFilter || getTodayDate()}</td>
                        <td className="p-3 border-r border-neutral-200 font-medium">{c.productName}</td>
                        <td className="p-3 border-r border-neutral-200 font-semibold">{cupsUsed.toFixed(2)}</td>
                        <td className="p-3 border-r border-neutral-200 text-red-600">{used} {ing?.unit}</td>
                        <td className="p-3 border-r border-neutral-200">{currentStock} {ing?.unit}</td>
                        <td className="p-3 border-r border-neutral-200 font-semibold">{available} {ing?.unit} ({cups.toFixed(2)} cups)</td>
                      </>;
                    })()}
                    <td className="p-3 text-center space-x-2">
                      <button onClick={() => handleEditCosting(c)} className="text-blue-600 hover:underline font-medium text-xs">Edit</button>
                      <button onClick={() => handleDeleteCosting(c.id)} className="text-red-600 hover:underline font-medium text-xs">Delete</button>
                    </td>
                  </tr>
                ))
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "used" && (
        <div className="space-y-6">
          <div className="overflow-x-auto rounded-lg border border-neutral-400 bg-white">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="bg-[#b5d6d8] border-b border-neutral-400 text-neutral-800 text-xs font-semibold">
                  <th className="p-3 border-r border-neutral-300">Date</th>
                  <th className="p-3 border-r border-neutral-300">Item Name</th>
                  <th className="p-3 border-r border-neutral-300 text-right">Used Amount</th>
                  <th className="p-3 text-center">Unit</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsages.length === 0 ? (
                  <tr><td colSpan={4} className="p-4 text-center text-neutral-500 text-xs">No usage records found.</td></tr>
                ) : (
                  filteredUsages.map((u) => (
                    <tr key={u.id} className="border-b border-neutral-200 text-xs">
                      <td className="p-3 border-r border-neutral-200 text-neutral-600">{u.date}</td>
                      <td className="p-3 border-r border-neutral-200 font-medium">{u.itemName}</td>
                      <td className="p-3 border-r border-neutral-200 text-right font-bold text-red-600">-{u.usedAmount}</td>
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