import { createClient } from "@supabase/supabase-js";
import type { InventoryItem, MenuItem, Order, Promotion, RecipeIngredient, StaffUser, StoreData, CostingItem } from "@/lib/types";
import { DEFAULT_MENU, MENU_CATEGORIES } from "@/lib/menu";
import { parsePayment } from "@/lib/payments";
import { DEFAULT_PROMOS } from "@/lib/promos";
import { DEFAULT_USERS } from "@/lib/users";

const STORE_STATE_ID = "commune-coffee";

let queue: Promise<unknown> = Promise.resolve();

function env(...names: string[]) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return undefined;
}

function supabaseAdmin() {
  const url = env(
    "SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
    "commume_coffee_SUPABASE_URL",
    "NEXT_PUBLIC_commume_coffee_SUPABASE_URL",
  );
  const key = env(
    "SUPABASE_SECRET_KEY",
    "commume_coffee_SUPABASE_SECRET_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "commume_coffee_SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_SERVICE_ROLE_KEY_2",
  );

  if (!url || !key) {
    throw new Error(
      "Supabase credentials are missing. Add the real SUPABASE_URL and SUPABASE_SECRET_KEY to .env.local, then restart Next.js.",
    );
  }

  if (!/^https:\/\/[^/]+\.supabase\.co$/.test(url)) {
    throw new Error("SUPABASE_URL must be the full https://<project-ref>.supabase.co URL.");
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function seedOrders(): Order[] {
  const items = [
    { productId: "spanish-latte", name: "Spanish Latte", price: 149 },
    { productId: "seasalt-cream", name: "Sea Salt Cream", price: 159 },
    { productId: "matcha-umami", name: "Matcha Umami", price: 169 },
    { productId: "cookie-crumble", name: "Cookie Crumble", price: 159 },
    { productId: "biscoff-latte", name: "Biscoff Latte", price: 169 },
    { productId: "caramel-macchiato", name: "Caramel Macchiato", price: 159 },
    { productId: "strawberry-crumble", name: "Strawberry Crumble", price: 159 },
    { productId: "panini", name: "Panini", price: 189 },
  ];

  const orders: Order[] = [];
  const now = new Date("2026-09-07T16:00:00+07:00");

  for (let dayOffset = 6; dayOffset >= 0; dayOffset -= 1) {
    const count = 4 + ((6 - dayOffset) % 3);
    for (let i = 0; i < count; i += 1) {
      const date = new Date(now);
      date.setDate(now.getDate() - dayOffset);
      date.setHours(11 + i, 10 + i * 7, 0, 0);
      const picked = items[(i + dayOffset) % items.length];
      const extra = items[(i + dayOffset + 2) % items.length];
      const qty = 1 + (i % 2);
      const lineItems = [
        {
          productId: picked.productId,
          name: picked.name,
          qty,
          price: picked.price,
        },
      ];
      if (i % 2 === 0) {
        lineItems.push({
          productId: extra.productId,
          name: extra.name,
          qty: 1,
          price: extra.price,
        });
      }
      const total = lineItems.reduce(
        (sum, item) => sum + item.price * item.qty,
        0,
      );
      orders.push({
        id: `ord-${dayOffset}-${i}`,
        createdAt: date.toISOString(),
        baristaName: "Sale In Charge",
        items: lineItems,
        total: Number(total.toFixed(2)),
        paymentMethod: (["cash", "gcash", "maya"] as const)[i % 3],
      });
    }
  }

  return orders;
}

const DEFAULT_INVENTORY: InventoryItem[] = [
  { id: "coffee-beans", name: "Coffee Beans", category: "Ingredients", unit: "grams", cost: 650, stock: 1000, maxStock: 5000 },
  { id: "milk", name: "Milk", category: "Dairy", unit: "ml", cost: 95, stock: 5000, maxStock: 10000 },
  { id: "cups", name: "Cups", category: "Packaging", unit: "pcs", cost: 3, stock: 200, maxStock: 1000 },
  { id: "matcha-powder", name: "Matcha Powder", category: "Ingredients", unit: "grams", cost: 450, stock: 500, maxStock: 1000 },
];

const DEFAULT_COSTINGS: CostingItem[] = [
  { id: "cost-coffee-beans", productName: "Coffee Beans", ingredients: [{ name: "Coffee Beans", amount: 1000, unit: "grams", outputCups: 55 }] },
  { id: "cost-milk", productName: "Milk", ingredients: [{ name: "Milk", amount: 1000, unit: "ml", outputCups: 7.5 }] },
  { id: "cost-matcha", productName: "Matcha Powder", ingredients: [{ name: "Matcha Powder", amount: 150, unit: "grams", outputCups: 15 }] },
];

const DEFAULT_RECIPES: Record<string, RecipeIngredient[]> = Object.fromEntries(
  DEFAULT_MENU.map((item) => [item.id, [
    { inventoryItemId: "coffee-beans", name: "Coffee Beans", amount: 18, unit: "grams" },
    { inventoryItemId: "milk", name: "Milk", amount: 133, unit: "ml" },
    { inventoryItemId: "cups", name: "Cups", amount: 1, unit: "pcs" },
  ]]),
);

function emptyStore(): StoreData {
  return {
    pos: { isOpen: false, openedAt: null, openedBy: null },
    orders: seedOrders(),
    menu: DEFAULT_MENU.map((item) => ({ ...item })),
    categories: [...MENU_CATEGORIES],
    promotions: DEFAULT_PROMOS.map((item) => ({ ...item })),
    users: DEFAULT_USERS.map((item) => ({ ...item })),
    inventory: DEFAULT_INVENTORY.map((item) => ({ ...item })),
    recipes: structuredClone(DEFAULT_RECIPES),
    usageLogs: [],
    restocks: [],
    costings: structuredClone(DEFAULT_COSTINGS),
  };
}

function uniqueCategories(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const name = value.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(name);
  }
  return result;
}

function normalizeStore(store: StoreData): StoreData {
  if (!Array.isArray(store.orders)) {
    store.orders = [];
  } else {
    store.orders = store.orders.map((order: Order) => ({
      ...order,
      paymentMethod: parsePayment(order.paymentMethod),
    }));
  }
  if (!Array.isArray(store.menu) || store.menu.length === 0) {
    store.menu = DEFAULT_MENU.map((item) => ({ ...item }));
  } else {
    store.menu = store.menu.map((item: MenuItem) => ({
      ...item,
      available: item.available !== false,
      image: item.image || "/images/drinks.jpg",
    }));
  }
  store.categories = uniqueCategories([
    ...(store.categories ?? []),
    ...MENU_CATEGORIES,
    ...store.menu.map((item) => item.category),
  ]);
  if (!Array.isArray(store.promotions) || store.promotions.length === 0) {
    store.promotions = DEFAULT_PROMOS.map((item) => ({ ...item }));
  } else {
    store.promotions = store.promotions.map((item: Promotion) => ({
      ...item,
      active: item.active !== false,
      type: item.type === "amount" ? "amount" : "percent",
      value: Number(item.value) || 0,
    }));
  }
  if (!Array.isArray(store.inventory)) {
    store.inventory = DEFAULT_INVENTORY.map((item) => ({ ...item }));
  } else {
    store.inventory = store.inventory.map((item) => ({
      ...item,
      stock: Number(item.stock) || 0,
      maxStock: Number(item.maxStock) || 0,
      cost: Number(item.cost) || 0,
      unit: item.unit || "pcs",
    }));
  }
  if (!store.recipes || typeof store.recipes !== "object") {
    store.recipes = structuredClone(DEFAULT_RECIPES);
  }
  if (!Array.isArray(store.usageLogs)) {
    store.usageLogs = [];
  }
  if (!Array.isArray(store.restocks)) {
    store.restocks = [];
  }
  if (!Array.isArray(store.costings)) {
    store.costings = [];
  }

  const matchaInventory = store.inventory.find((item) => /matcha/i.test(item.name));
  const hasMatchaCosting = store.costings.some((costing) =>
    costing.ingredients.some((ingredient) => /matcha/i.test(ingredient.name)),
  );
  if (matchaInventory && !hasMatchaCosting) {
    store.costings.push({
      id: "cost-matcha-powder",
      productName: "Matcha Powder",
      ingredients: [{ name: matchaInventory.name, amount: 150, unit: "grams", outputCups: 15 }],
    });
  }

  if (!Array.isArray(store.users) || store.users.length === 0) {
    store.users = DEFAULT_USERS.map((item) => ({ ...item }));
  } else {
    store.users = store.users.map((item: StaffUser) => ({
      ...item,
      username: String(item.username ?? "").toLowerCase(),
      name: item.name || item.username,
      title: item.title || (item.role === "admin" ? "Owner" : "Barista"),
      role: item.role === "admin" ? "admin" : "barista",
      password: String(item.password ?? ""),
    }));
  }
  return store;
}

export function usesBlobStorage() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}

async function readStore(): Promise<StoreData> {
  const { data, error } = await supabaseAdmin()
    .from("store_state")
    .select("payload")
    .eq("id", STORE_STATE_ID)
    .maybeSingle();
  if (error) throw new Error(`Unable to read store state: ${error.message}`);
  if (!data?.payload) {
    const store = emptyStore();
    await writeStore(store);
    return store;
  }

  const original = data.payload as StoreData;
  const store = normalizeStore(original);
  const originalCostings = Array.isArray(original.costings) ? original.costings : [];
  if (store.costings.length !== originalCostings.length) {
    await writeStore(store);
  }
  return store;
}

async function writeStore(store: StoreData): Promise<void> {
  const { error } = await supabaseAdmin().from("store_state").upsert(
    { id: STORE_STATE_ID, payload: store, updated_at: new Date().toISOString() },
    { onConflict: "id" },
  );
  if (error) throw new Error(`Unable to save store state: ${error.message}`);
}

function withStore<T>(fn: (store: StoreData) => Promise<T> | T): Promise<T> {
  const run = queue.then(async () => {
    const store = await readStore();
    return fn(store);
  });
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export function getStore(): Promise<StoreData> {
  return withStore((store) => store);
}

export function updateStore(
  fn: (store: StoreData) => void,
): Promise<StoreData> {
  return withStore(async (store) => {
    fn(store);
    await writeStore(store);
    return store;
  });
}

