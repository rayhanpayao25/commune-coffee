"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { nextTicketNo } from "@/lib/escpos";
import { parsePayment } from "@/lib/payments";
import { updateStore } from "@/lib/store";
import type { OrderItem } from "@/lib/types";

async function requireBarista() {
  const session = await getSession();
  if (!session || session.role !== "barista") {
    throw new Error("Only the barista can use the POS.");
  }
  return session;
}

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    throw new Error("Only an admin can change store records.");
  }
}

export async function deleteAdminRecord(kind: "order" | "inventory" | "restock" | "costing", id: string) {
  await requireAdmin();
  await updateStore((store) => {
    if (kind === "order") {
      store.orders = store.orders.filter((order) => order.id !== id);
      store.usageLogs = store.usageLogs.filter((entry) => entry.orderId !== id);
    } else if (kind === "inventory") {
      store.inventory = store.inventory.filter((item) => item.id !== id);
    } else if (kind === "restock") {
      store.restocks = store.restocks.filter((record) => record.id !== id);
    } else {
      store.costings = store.costings.filter((record) => record.id !== id);
    }
  });
  revalidatePath("/admin");
  return { ok: true };
}

export async function openPos() {
  const session = await requireBarista();
  await updateStore((store) => {
    store.pos = {
      isOpen: true,
      openedAt: new Date().toISOString(),
      openedBy: session.name,
    };
  });
  revalidatePath("/pos");
  revalidatePath("/admin");
}

export async function closePos() {
  await requireBarista();
  await updateStore((store) => {
    store.pos = {
      isOpen: false,
      openedAt: null,
      openedBy: null,
    };
  });
  revalidatePath("/pos");
  revalidatePath("/admin");
}

export async function createOrder(
  cart: OrderItem[],
  promoId?: string | null,
  paymentMethod?: string | null,
  tendered?: number | null,
) {
  const session = await requireBarista();

  if (cart.length === 0) {
    return { error: "Add a drink before charging." };
  }

  const priced: OrderItem[] = [];
  let error: string | undefined;
  let charged = 0;
  let ticketNo = "";

  await updateStore((store) => {
    if (!store.pos.isOpen) {
      error = "Open the POS before taking orders.";
      return;
    }

    for (const line of cart) {
      const menuItem = store.menu.find((item) => item.id === line.productId);
      const qty = Number(line.qty);
      if (!menuItem || !menuItem.available) {
        error = "One of the items is no longer on the menu.";
        return;
      }
      if (!Number.isSafeInteger(qty) || qty < 1 || qty > 99) {
        error = "Each item quantity must be a whole number from 1 to 99.";
        return;
      }
      priced.push({
        productId: menuItem.id,
        name: menuItem.name,
        qty,
        price: menuItem.price,
      });
    }

    const requestedStock = new Map<string, number>();
    for (const line of priced) {
      for (const ingredient of store.recipes[line.productId] ?? []) {
        const inventory = store.inventory.find(
          (item) =>
            item.id === ingredient.inventoryItemId ||
            item.name.toLowerCase() === ingredient.name.toLowerCase(),
        );
        if (inventory) {
          requestedStock.set(
            inventory.id,
            (requestedStock.get(inventory.id) ?? 0) + ingredient.amount * line.qty,
          );
        }
      }
    }
    for (const [inventoryId, requested] of requestedStock) {
      const inventory = store.inventory.find((item) => item.id === inventoryId);
      if (inventory && inventory.stock < requested) {
        error = `Not enough ${inventory.name} in stock.`;
        return;
      }
    }

    const subtotal = priced.reduce((sum, item) => sum + item.price * item.qty, 0);
    let discount = 0;
    let promoLabel: string | undefined;
    if (promoId) {
      const found = store.promotions.find(
        (entry) => entry.id === promoId && entry.active,
      );
      if (!found) {
        error = "That promotion is no longer available.";
        return;
      }
      promoLabel = found.label;
      discount =
        found.type === "percent"
          ? Math.round((subtotal * found.value) / 100)
          : Math.min(subtotal, Math.round(found.value));
    }
    const total = Math.max(0, subtotal - discount);
    const method = parsePayment(paymentMethod);
    const cashIn =
      method === "cash" ? Math.max(0, Math.round(Number(tendered) || 0)) : total;
    if (method === "cash" && cashIn < total) {
      error = "Cash tendered is short.";
      return;
    }
    charged = total;
    ticketNo = nextTicketNo(store.orders);
    const orderId = `ord-${Date.now()}`;
    const createdAt = new Date().toISOString();
    const usageEntries = [] as typeof store.usageLogs;

    for (const line of priced) {
      const ingredients = store.recipes[line.productId] ?? [];
      for (const ingredient of ingredients) {
        const amount = ingredient.amount * line.qty;
        const inventory = store.inventory.find((item) =>
          item.id === ingredient.inventoryItemId || item.name.toLowerCase() === ingredient.name.toLowerCase(),
        );
        if (!inventory) continue;
        inventory.stock = Math.max(0, inventory.stock - amount);
        usageEntries.push({
          id: `${orderId}-${inventory.id}`,
          orderId,
          orderItemId: line.productId,
          date: createdAt,
          itemName: inventory.name,
          usedAmount: amount,
          unit: ingredient.unit,
        });
      }
    }
    store.usageLogs = [...store.usageLogs.filter((entry) => entry.orderId !== orderId), ...usageEntries];

    store.orders.push({
      id: orderId,
      createdAt,
      baristaName: session.name,
      items: priced,
      subtotal,
      discount,
      promoLabel,
      total,
      paymentMethod: method,
      ticketNo,
      paid: cashIn,
      change: method === "cash" ? cashIn - total : 0,
    });
  });

  if (error) return { error };

  revalidatePath("/pos");
  revalidatePath("/admin");
  return { ok: true, total: charged, ticketNo };
}

export async function voidOrder(orderId: string) {
  await requireBarista();
  let error: string | undefined;

  await updateStore((store) => {
    const order = store.orders.find((entry) => entry.id === orderId);
    if (!order) {
      error = "Ticket not found.";
      return;
    }
    order.voided = true;
  });

  if (error) return { error };
  revalidatePath("/pos");
  revalidatePath("/admin");
  return { ok: true };
}
