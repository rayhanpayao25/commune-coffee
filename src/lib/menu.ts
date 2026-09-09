import type { MenuItem } from "@/lib/types";

export const MENU_IMAGES = [
  { label: "Logo", src: "/images/logo.jpg" },
] as const;

export const MENU_CATEGORIES = [
  "Special",
  "Classic",
  "Non-Coffee",
  "Fresh Drinks",
  "Matcha Drinks",
  "Food",
  "Pastries",
] as const;

export const DEFAULT_MENU: MenuItem[] = ([
  // Special
  { id: "commune-signature", name: "Commune Signature", price: 170, category: "Special", available: true },
  { id: "honey-oat", name: "Honey Oat", price: 170, category: "Special", available: true },
  { id: "spanish-latte", name: "Spanish Latte", price: 125, category: "Special", available: true },
  { id: "sea-salt-cream", name: "Sea Salt Cream", price: 135, category: "Special", available: true },

  // Classic Coffee
  { id: "americano-long-black", name: "Americano / Long Black", price: 120, category: "Classic", available: true },
  { id: "latte", name: "Latte", price: 140, category: "Classic", available: true },
  { id: "cappuccino", name: "Cappuccino", price: 150, category: "Classic", available: true },
  { id: "biscoff-latte", name: "Biscoff Latte", price: 150, category: "Classic", available: true },
  { id: "caramel-macchiato", name: "Caramel Macchiato", price: 130, category: "Classic", available: true },
  { id: "hazelnut-blanc", name: "Hazelnut Blanc", price: 130, category: "Classic", available: true },

  // Non-Coffee
  { id: "strawberry-creme", name: "Strawberry Créme", price: 130, category: "Non-Coffee", available: true },
  { id: "oreo-blush", name: "Oreo Blush", price: 120, category: "Non-Coffee", available: true },
  { id: "chocolate", name: "Chocolate", price: 120, category: "Non-Coffee", available: true },

  // Fresh Drinks
  { id: "strawberry-whisper", name: "Strawberry Whisper", price: 120, category: "Fresh Drinks", available: true },
  { id: "watermelon-whisper", name: "Watermelon Whisper", price: 120, category: "Fresh Drinks", available: true },

  // Matcha Drinks
  { id: "matcha-umami", name: "Matcha Umami", price: 190, category: "Matcha Drinks", available: true },
  { id: "matcha-latte", name: "Matcha Latte", price: 155, category: "Matcha Drinks", available: true },
  { id: "hojicha-latte", name: "Hojicha Latte", price: 155, category: "Matcha Drinks", available: true },
  { id: "matcha-creme-latte", name: "Matcha Créme Latte", price: 155, category: "Matcha Drinks", available: true },
  { id: "sea-salt-matcha-cloud", name: "Sea Salt Matcha Cloud", price: 155, category: "Matcha Drinks", available: true },

  // Food
  { id: "fries", name: "Fries", price: 120, category: "Food", available: true },
  { id: "tuna-sandwich", name: "Tuna Sandwich", price: 130, category: "Food", available: true },
  { id: "club-sandwich", name: "Club Sandwich", price: 180, category: "Food", available: true },

  // Pastries
  { id: "choco-chip-cookie", name: "Choco Chip Cookie", price: 80, category: "Pastries", available: true },
  { id: "red-velvet-cookie", name: "Red Velvet Cookie", price: 80, category: "Pastries", available: true },
  { id: "choco-fudge", name: "Choco Fudge", price: 85, category: "Pastries", available: true },
  { id: "revel-bar", name: "Revel Bar", price: 85, category: "Pastries", available: true },
]).map((item) => ({
  ...item,
  image: MENU_IMAGES[0].src,
}));

export const MENU = DEFAULT_MENU;

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function menuItemId(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${slug || "item"}-${Date.now().toString(36)}`;
}