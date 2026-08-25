"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Check,
  Coins,
  Gem,
  Plus,
  Receipt,
  ShieldCheck,
  Sparkles,
  CreditCard,
  Lock,
} from "lucide-react";
import {
  Wallet,
  credit,
  loadWallet,
  subscribe,
} from "@/lib/wallet";

/* ------------------------- charge packages ------------------------ */

interface Pack {
  id: string;
  coins: number;
  gems: number;
  price: string; // toman (demo)
  tag?: string;
  best?: boolean;
}

const PACKS: Pack[] = [
  { id: "p1", coins: 1000, gems: 0, price: "۴۹,۰۰۰" },
  { id: "p2", coins: 5000, gems: 5, price: "۱۹۹,۰۰۰", tag: "محبوب" },
  { id: "p3", coins: 12000, gems: 15, price: "۴۴۹,۰۰۰", best: true },
  { id: "p4", coins: 30000, gems: 40, price: "۹۹۰,۰۰۰", tag: "ویژه" },
];

/* ================================================================= */

export default function WalletClient() {
  const [wallet, setWallet] = useState<Wallet | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      return loadWallet();
    } catch {
      return null;
    }
  });
  const [paying, setPaying] = useState<Pack | null>(null);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [card, setCard] = useState({ number: "", name: "", cvv: "" });

  useEffect(() => {
    return subscribe(setWallet);
  }, []);

  const startPayment = (p: Pack) => {
    setPaying(p);
    setDone(false);
    setCard({ number: "", name: "", cvv: "" });
  };

  const completePayment = () => {
    if (!paying || !wallet) return;
    setProcessing(true);
    // simulated payment gateway
    window.setTimeout(() => {
      let w = wallet;
      if (paying.coins > 0)
        w = credit(w, `شارژ ${paying.coins.toLocaleString("fa-IR")} سکه`, paying.coins, "coins");
      if (paying.gems > 0)
        w = credit(w, `شارژ ${paying.gems} جواهر`, paying.gems, "gems");
      setWallet(w);
      setProcessing(false);
      setDone(true);
    }, 1600);
  };

  if (!wallet) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="size-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors mb-8 cursor-pointer"
      >
        <ArrowRight className="size-4" />
        بازگشت به خانه
      </Link>

      {/* balance cards */}
      <div className="grid gap-4 sm:grid-cols-2 mb-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl p-6 border border-line bg-gradient-to-br from-surface-2 to-surface relative overflow-hidden"
        >
          <Coins className="size-8 text-accent mb-3" />
          <div className="text-sm text-muted">سکه‌های شما</div>
          <div className="font-latin text-4xl font-bold mt-1">
            {wallet.coins.toLocaleString("fa-IR")}
          </div>
          <div className="absolute -bottom-8 -left-8 size-36 rounded-full bg-accent/10 blur-2xl" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="rounded-3xl p-6 border border-line bg-gradient-to-br from-surface-2 to-surface relative overflow-hidden"
        >
          <Gem className="size-8 text-secondary mb-3" />
          <div className="text-sm text-muted">جواهرهای شما</div>
          <div className="font-latin text-4xl font-bold mt-1">
            {wallet.gems.toLocaleString("fa-IR")}
          </div>
          <div className="absolute -bottom-8 -left-8 size-36 rounded-full bg-secondary/10 blur-2xl" />
        </motion.div>
      </div>

      {/* packages */}
      <h2 className="font-display text-2xl mb-2">شارژ کیف پول</h2>
      <p className="text-muted text-sm mb-6">
        بسته‌ها را شارژ کنید و با ارز دیجیتال داخلی (سکه و جواهر) از فروشگاه آیتم بخرید
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-12">
        {PACKS.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
            className={`card-3d rounded-3xl p-6 border relative ${
              p.best ? "border-primary shadow-glow" : "border-line bg-surface"
            }`}
          >
            {p.tag && (
              <span className="absolute -top-3 right-4 rounded-full bg-accent text-[#2d1a00] text-xs font-bold px-3 py-1">
                {p.tag}
              </span>
            )}
            <Sparkles className={`size-6 mb-4 ${p.best ? "text-primary" : "text-muted"}`} />
            <div className="flex items-center gap-2 mb-2">
              <Coins className="size-5 text-accent" />
              <span className="font-latin text-2xl font-bold">
                {p.coins.toLocaleString("fa-IR")}
              </span>
              <span className="text-xs text-muted">سکه</span>
            </div>
            {p.gems > 0 && (
              <div className="flex items-center gap-2 mb-2">
                <Gem className="size-5 text-secondary" />
                <span className="font-latin text-2xl font-bold">{p.gems}</span>
                <span className="text-xs text-muted">جواهر</span>
              </div>
            )}
            <div className="my-4 h-px bg-line" />
            <div className="font-latin text-lg mb-4">{p.price} تومان</div>
            <button
              onClick={() => startPayment(p)}
              className={`w-full ${p.best ? "btn-primary" : "btn-ghost"} !py-2.5 text-sm`}
            >
              <Plus className="size-4" />
              خرید بسته
            </button>
          </motion.div>
        ))}
      </div>

      {/* transactions */}
      <h2 className="font-display text-2xl mb-4 flex items-center gap-2">
        <Receipt className="size-6 text-primary" />
        تراکنش‌های اخیر
      </h2>
      <div className="rounded-2xl border border-line divide-y divide-line overflow-hidden">
        {wallet.transactions.length === 0 && (
          <div className="p-6 text-center text-muted text-sm">هنوز تراکنشی ندارید</div>
        )}
        {wallet.transactions.map((t) => (
          <div key={t.id} className="flex items-center justify-between gap-4 p-4 bg-surface/60">
            <div className="flex items-center gap-3 min-w-0">
              {t.amount > 0 ? (
                <span className="rounded-full bg-primary/15 p-2">
                  <Plus className="size-4 text-primary" />
                </span>
              ) : (
                <span className="rounded-full bg-rose/15 p-2">
                  <Receipt className="size-4 text-rose" />
                </span>
              )}
              <div className="min-w-0">
                <div className="text-sm font-bold truncate">{t.title}</div>
                <div className="text-xs text-muted">
                  {new Date(t.date).toLocaleDateString("fa-IR", {
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
            <div
              className={`font-latin font-bold shrink-0 ${
                t.amount > 0 ? "text-primary" : "text-rose"
              }`}
              dir="ltr"
            >
              {t.amount > 0 ? "+" : ""}
              {t.amount.toLocaleString("fa-IR")}
              {t.currency !== "toman" ? " " + (t.currency === "coins" ? "سکه" : "جواهر") : " تومان"}
            </div>
          </div>
        ))}
      </div>

      {/* payment modal */}
      <AnimatePresence>
        {paying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-sm p-4"
            onClick={() => !processing && setPaying(null)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 24 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 24 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong rounded-3xl p-6 sm:p-8 w-full max-w-md"
            >
              {done ? (
                <div className="text-center py-6">
                  <div className="mx-auto mb-4 rounded-full bg-primary/20 p-4 w-fit">
                    <Check className="size-10 text-primary" />
                  </div>
                  <h3 className="font-display text-xl mb-2">پرداخت موفق!</h3>
                  <p className="text-muted text-sm mb-6">
                    {paying.coins > 0 && `${paying.coins.toLocaleString("fa-IR")} سکه `}
                    {paying.gems > 0 && `و ${paying.gems} جواهر `}
                    به کیف پول شما اضافه شد.
                  </p>
                  <button onClick={() => setPaying(null)} className="btn-primary">
                    عالیه!
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <span className="rounded-2xl bg-primary/15 p-3">
                      <CreditCard className="size-6 text-primary" />
                    </span>
                    <div>
                      <h3 className="font-display text-lg">درگاه پرداخت</h3>
                      <p className="text-xs text-muted">
                        بسته {paying.coins.toLocaleString("fa-IR")} سکه — {paying.price} تومان
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <label className="block">
                      <span className="text-xs text-muted mb-1.5 block">شماره کارت</span>
                      <input
                        dir="ltr"
                        inputMode="numeric"
                        placeholder="6037 99•• •••• ••••"
                        value={card.number}
                        onChange={(e) => setCard({ ...card, number: e.target.value })}
                        className="w-full rounded-xl bg-surface-2 border border-line px-4 py-3 font-latin text-left focus:border-primary focus:outline-none"
                      />
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <label className="block">
                        <span className="text-xs text-muted mb-1.5 block">نام صاحب کارت</span>
                        <input
                          dir="ltr"
                          placeholder="ALI AHMADI"
                          value={card.name}
                          onChange={(e) => setCard({ ...card, name: e.target.value })}
                          className="w-full rounded-xl bg-surface-2 border border-line px-4 py-3 font-latin text-left focus:border-primary focus:outline-none"
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs text-muted mb-1.5 block">CVV2</span>
                        <input
                          dir="ltr"
                          inputMode="numeric"
                          placeholder="•••"
                          value={card.cvv}
                          onChange={(e) => setCard({ ...card, cvv: e.target.value })}
                          className="w-full rounded-xl bg-surface-2 border border-line px-4 py-3 font-latin text-left focus:border-primary focus:outline-none"
                        />
                      </label>
                    </div>
                  </div>

                  <button
                    onClick={completePayment}
                    disabled={processing}
                    className="w-full btn-primary disabled:opacity-60"
                  >
                    {processing ? (
                      <>
                        <div className="size-5 rounded-full border-2 border-[#06220f] border-t-transparent animate-spin" />
                        در حال پردازش…
                      </>
                    ) : (
                      <>
                        <Lock className="size-5" />
                        پرداخت امن
                      </>
                    )}
                  </button>
                  <p className="text-center text-[11px] text-muted mt-4 flex items-center justify-center gap-1.5">
                    <ShieldCheck className="size-4" />
                    این درگاه نمایشی است و مبلغی دریافت نمی‌شود
                  </p>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
