"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Coins,
  Gem,
  ShoppingCart,
  Sparkles,
  Star,
  Wand2,
} from "lucide-react";
import {
  Owned,
  SHOP_ITEMS,
  ShopItem,
  Wallet,
  debit,
  loadOwned,
  loadWallet,
  saveOwned,
  subscribe,
  subscribeOwned,
} from "@/lib/wallet";

const CATEGORY_LABEL: Record<ShopItem["category"], string> = {
  cue: "کیو",
  table: "میز",
  chalk: "گونه",
};

function StatBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-muted w-8">{label}</span>
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 w-3.5 rounded-full ${
              i < value ? "bg-primary" : "bg-white/10"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default function ShopClient() {
  const [wallet, setWallet] = useState<Wallet | null>(() => {
    // Initialize synchronously to avoid setState-in-effect
    if (typeof window === "undefined") return null;
    try {
      return loadWallet();
    } catch {
      return null;
    }
  });
  const [owned, setOwned] = useState<Owned | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      return loadOwned();
    } catch {
      return null;
    }
  });
  const [filter, setFilter] = useState<"all" | ShopItem["category"]>("all");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const un1 = subscribe(setWallet);
    const un2 = subscribeOwned(setOwned);
    return () => {
      un1();
      un2();
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(t);
  }, [toast]);

  if (!wallet || !owned) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="size-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const items = SHOP_ITEMS.filter((i) => filter === "all" || i.category === filter);

  const buy = (item: ShopItem) => {
    if (!wallet || !owned) return;
    if (owned.items.includes(item.id)) {
      setOwned({ ...owned, equippedCue: item.id });
      saveOwned({ ...owned, equippedCue: item.id });
      setToast(`${item.name} انتخاب شد`);
      return;
    }
    const res = debit(wallet, `خرید ${item.name}`, item.price, item.currency);
    if (!res.ok) {
      setToast(
        item.currency === "coins"
          ? "سکه کافی ندارید — کیف پول را شارژ کنید"
          : "جواهر کافی ندارید — کیف پول را شارژ کنید",
      );
      return;
    }
    setWallet(res.wallet);
    const nextOwned = {
      ...owned,
      items: [...owned.items, item.id],
      equippedCue: item.category === "cue" ? item.id : owned.equippedCue,
    };
    setOwned(nextOwned);
    saveOwned(nextOwned);
    setToast(`${item.name} خریداری شد!`);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors mb-8 cursor-pointer"
      >
        <ArrowRight className="size-4" />
        بازگشت به خانه
      </Link>

      {/* header */}
      <div className="relative rounded-3xl overflow-hidden border border-line mb-10">
        <Image
          src="/images/shop-cues.jpg"
          alt="فروشگاه کیوورس"
          width={1200}
          height={400}
          className="w-full h-48 sm:h-64 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-bg/90 via-bg/50 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-10">
          <h1 className="font-display text-3xl sm:text-4xl mb-2">
            <span className="text-gradient-gold">فروشگاه</span> کیوورس
          </h1>
          <p className="text-muted text-sm max-w-md">
            با سکه و جواهر، کیوهای حرفه‌ای، میزهای خاص و گونه‌های اسپین‌دار بخرید
          </p>
        </div>
      </div>

      {/* balance */}
      <div className="flex flex-wrap items-center gap-4 mb-8">
        <div className="glass rounded-2xl px-5 py-3 flex items-center gap-2">
          <Coins className="size-5 text-accent" />
          <span className="font-latin font-bold text-lg">
            {wallet.coins.toLocaleString("fa-IR")}
          </span>
          <span className="text-xs text-muted">سکه</span>
        </div>
        <div className="glass rounded-2xl px-5 py-3 flex items-center gap-2">
          <Gem className="size-5 text-secondary" />
          <span className="font-latin font-bold text-lg">
            {wallet.gems.toLocaleString("fa-IR")}
          </span>
          <span className="text-xs text-muted">جواهر</span>
        </div>
        <Link href="/wallet" className="btn-gold !py-2.5 !px-5 text-sm mr-auto">
          <Sparkles className="size-4" />
          شارژ کیف پول
        </Link>
      </div>

      {/* filter */}
      <div className="flex gap-2 mb-8">
        {(["all", "cue", "table", "chalk"] as const).map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`rounded-full px-4 py-2 text-sm transition-colors cursor-pointer ${
              filter === c
                ? "bg-primary text-[#06220f] font-bold"
                : "bg-white/5 hover:bg-white/10 text-muted"
            }`}
          >
            {c === "all" ? "همه" : CATEGORY_LABEL[c]}
          </button>
        ))}
      </div>

      {/* items */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-16">
        {items.map((item, i) => {
          const isOwned = owned.items.includes(item.id);
          const isEquipped = owned.equippedCue === item.id;
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 3) * 0.07 }}
              className={`card-3d rounded-3xl border p-6 relative ${
                isEquipped ? "border-primary shadow-glow" : "border-line bg-surface"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <span
                  className={`rounded-full text-[11px] font-bold px-3 py-1 ${
                    item.rarity === "افسانه‌ای"
                      ? "bg-accent/20 text-accent"
                      : item.rarity === "حماسی"
                        ? "bg-secondary/20 text-secondary"
                        : item.rarity === "کمیاب"
                          ? "bg-primary/15 text-primary"
                          : "bg-white/10 text-muted"
                  }`}
                >
                  {item.rarity}
                </span>
                {isEquipped && (
                  <span className="flex items-center gap-1 text-[11px] text-primary font-bold">
                    <Check className="size-3.5" />
                    فعال
                  </span>
                )}
              </div>

              <h3 className="font-display text-lg mb-1">{item.name}</h3>
              <p className="text-xs text-muted leading-5 mb-4 min-h-10">{item.desc}</p>

              <div className="space-y-1.5 mb-5">
                <StatBar label="قدرت" value={item.power} />
                <StatBar label="دقت" value={item.aim} />
                <StatBar label="اسپین" value={item.spin} />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {item.currency === "coins" ? (
                    <Coins className="size-5 text-accent" />
                  ) : (
                    <Gem className="size-5 text-secondary" />
                  )}
                  <span className="font-latin font-bold text-lg">
                    {item.price.toLocaleString("fa-IR")}
                  </span>
                </div>
                <button
                  onClick={() => buy(item)}
                  className={`${
                    isOwned
                      ? "btn-ghost"
                      : item.currency === "gems"
                        ? "btn-gold"
                        : "btn-primary"
                  } !py-2 !px-4 text-sm !rounded-xl`}
                >
                  {isOwned ? (
                    isEquipped ? (
                      <>
                        <Star className="size-4" />
                        انتخاب شده
                      </>
                    ) : (
                      <>
                        <Wand2 className="size-4" />
                        انتخاب
                      </>
                    )
                  ) : (
                    <>
                      <ShoppingCart className="size-4" />
                      خرید
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 glass-strong rounded-full px-6 py-3 text-sm font-bold whitespace-nowrap"
        >
          {toast}
        </motion.div>
      )}
    </div>
  );
}
