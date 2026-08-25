/* ------------------------------------------------------------------ */
/*  Client-side wallet — coins & gems persisted in localStorage        */
/*  (the app runs with zero database by design)                        */
/* ------------------------------------------------------------------ */

export interface Transaction {
  id: string;
  title: string;
  amount: number; // +credit / -debit
  currency: "coins" | "gems" | "toman";
  date: string; // ISO
}

export interface Wallet {
  coins: number;
  gems: number;
  transactions: Transaction[];
}

const KEY = "cueverse-wallet-v1";
const EVENT = "cueverse-wallet-change";

export function defaultWallet(): Wallet {
  return {
    coins: 2500,
    gems: 25,
    transactions: [
      {
        id: "welcome",
        title: "هدیه خوش‌آمدگویی",
        amount: 2500,
        currency: "coins",
        date: new Date().toISOString(),
      },
    ],
  };
}

export function loadWallet(): Wallet {
  if (typeof window === "undefined") return defaultWallet();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultWallet();
    const w = JSON.parse(raw) as Wallet;
    if (typeof w.coins !== "number" || typeof w.gems !== "number") {
      return defaultWallet();
    }
    return { ...defaultWallet(), ...w, transactions: w.transactions ?? [] };
  } catch {
    return defaultWallet();
  }
}

export function saveWallet(w: Wallet) {
  localStorage.setItem(KEY, JSON.stringify(w));
  window.dispatchEvent(new CustomEvent(EVENT, { detail: w }));
}

export function subscribe(cb: (w: Wallet) => void): () => void {
  const handler = (e: Event) => cb((e as CustomEvent<Wallet>).detail);
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}

/* ------------------------------ ops ------------------------------ */

export function credit(w: Wallet, title: string, amount: number, currency: "coins" | "gems"): Wallet {
  const next: Wallet = {
    ...w,
    [currency]: w[currency] + amount,
    transactions: [
      { id: crypto.randomUUID(), title, amount, currency, date: new Date().toISOString() },
      ...w.transactions,
    ].slice(0, 60),
  };
  saveWallet(next);
  return next;
}

export function debit(w: Wallet, title: string, amount: number, currency: "coins" | "gems"): { ok: boolean; wallet: Wallet } {
  if (w[currency] < amount) return { ok: false, wallet: w };
  const next: Wallet = {
    ...w,
    [currency]: w[currency] - amount,
    transactions: [
      { id: crypto.randomUUID(), title, amount: -amount, currency, date: new Date().toISOString() },
      ...w.transactions,
    ].slice(0, 60),
  };
  saveWallet(next);
  return { ok: true, wallet: next };
}

/* --------------------------- shop items --------------------------- */

export interface ShopItem {
  id: string;
  name: string;
  category: "cue" | "table" | "chalk";
  price: number;
  currency: "coins" | "gems";
  icon: string; // lucide icon name rendered via map
  power: number; // 1-5
  aim: number; // 1-5
  spin: number; // 1-5
  rarity: "معمولی" | "کمیاب" | "حماسی" | "افسانه‌ای";
  desc: string;
}

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: "cue-maple",
    name: "کیو افرا",
    category: "cue",
    price: 1200,
    currency: "coins",
    icon: "cue",
    power: 2, aim: 3, spin: 2,
    rarity: "معمولی",
    desc: "کیو استاندارد چوب افرا برای شروع حرفه‌ای",
  },
  {
    id: "cue-obsidian",
    name: "کیو اُبسیدین",
    category: "cue",
    price: 4800,
    currency: "coins",
    icon: "cue",
    power: 4, aim: 3, spin: 3,
    rarity: "کمیاب",
    desc: "بدنه کربنی با نوک دقیق — ضربات نفوذی قوی",
  },
  {
    id: "cue-dragon",
    name: "کیو اژدها",
    category: "cue",
    price: 60,
    currency: "gems",
    icon: "cue",
    power: 5, aim: 4, spin: 4,
    rarity: "حماسی",
    desc: "کیوی افسانه‌ای با کنده‌کاری اژدها و تعادل بی‌نظیر",
  },
  {
    id: "cue-phoenix",
    name: "کیو فونیکس",
    category: "cue",
    price: 120,
    currency: "gems",
    icon: "cue",
    power: 5, aim: 5, spin: 5,
    rarity: "افسانه‌ای",
    desc: "نایاب‌ترین کیوی که ساخته شده — ضربه، دقت و اسپین کامل",
  },
  {
    id: "table-crimson",
    name: "میز سرخ",
    category: "table",
    price: 3500,
    currency: "coins",
    icon: "table",
    power: 3, aim: 2, spin: 1,
    rarity: "کمیاب",
    desc: "مخمل سرخ سلطنتی با قاب چوب گردو",
  },
  {
    id: "table-midnight",
    name: "میز نیمه‌شب",
    category: "table",
    price: 45,
    currency: "gems",
    icon: "table",
    power: 3, aim: 3, spin: 2,
    rarity: "حماسی",
    desc: "مخمل سرمه‌ای با نورپردازی LED زیر قاب",
  },
  {
    id: "chalk-blue",
    name: "گونه آبی",
    category: "chalk",
    price: 400,
    currency: "coins",
    icon: "chalk",
    power: 1, aim: 3, spin: 3,
    rarity: "معمولی",
    desc: "گونۀ استاندارد برای اسپین بهتر",
  },
  {
    id: "chalk-gold",
    name: "گونه طلایی",
    category: "chalk",
    price: 30,
    currency: "gems",
    icon: "chalk",
    power: 2, aim: 4, spin: 5,
    rarity: "حماسی",
    desc: "گونه طلایی ویژه — بیشترین کنترل اسپین",
  },
];

export interface Owned {
  items: string[];
  equippedCue: string | null;
}

const OWNED_KEY = "cueverse-owned-v1";
const OWNED_EVENT = "cueverse-owned-change";

export function loadOwned(): Owned {
  if (typeof window === "undefined") return { items: [], equippedCue: null };
  try {
    const raw = localStorage.getItem(OWNED_KEY);
    if (!raw) return { items: [], equippedCue: null };
    return JSON.parse(raw) as Owned;
  } catch {
    return { items: [], equippedCue: null };
  }
}

export function saveOwned(o: Owned) {
  localStorage.setItem(OWNED_KEY, JSON.stringify(o));
  window.dispatchEvent(new CustomEvent(OWNED_EVENT, { detail: o }));
}

export function subscribeOwned(cb: (o: Owned) => void): () => void {
  const handler = (e: Event) => cb((e as CustomEvent<Owned>).detail);
  window.addEventListener(OWNED_EVENT, handler);
  return () => window.removeEventListener(OWNED_EVENT, handler);
}
