"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Share, SquarePlus, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWARegister() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOS, setShowIOS] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      return localStorage.getItem("cueverse-install-dismissed") === "1";
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      const register = () => navigator.serviceWorker.register("/sw.js").catch(() => {});
      if (document.readyState === "complete") register();
      else window.addEventListener("load", register, { once: true });
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    // iOS has no install prompt — show custom hint
    const isIOS =
      /iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const iosDismissed =
      typeof window !== "undefined" &&
      localStorage.getItem("cueverse-ios-dismissed") === "1";
    if (isIOS && !iosDismissed) {
      const t = window.setTimeout(() => setShowIOS(true), 4000);
      return () => {
        window.clearTimeout(t);
        window.removeEventListener("beforeinstallprompt", onPrompt);
      };
    }
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") setDeferred(null);
  };

  const dismiss = (key: string) => {
    localStorage.setItem(key, "1");
    setDismissed(true);
    setShowIOS(false);
  };

  return (
    <>
      {/* Android / Chrome install button */}
      <AnimatePresence>
        {deferred && !dismissed && (
          <motion.button
            initial={{ opacity: 0, y: 24, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.9 }}
            onClick={install}
            className="fixed bottom-5 left-5 z-50 btn-gold !py-3 !px-5 !rounded-2xl text-sm shadow-gold"
          >
            <Download className="size-5" />
            نصب اپلیکیشن
          </motion.button>
        )}
      </AnimatePresence>

      {/* iOS hint */}
      <AnimatePresence>
        {showIOS && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed bottom-5 inset-x-4 z-50 glass-strong rounded-2xl p-4 flex items-center gap-3 max-w-md mx-auto"
          >
            <div className="flex gap-2 text-primary shrink-0">
              <Share className="size-5" />
              <SquarePlus className="size-5" />
            </div>
            <p className="text-xs leading-5 flex-1">
              برای نصب روی آیفون: در سافاری روی دکمه اشتراک‌گذاری بزنید و
              گزینه «افزودن به صفحه اصلی» را انتخاب کنید.
            </p>
            <button
              onClick={() => dismiss("cueverse-ios-dismissed")}
              className="rounded-lg p-2 hover:bg-white/10 cursor-pointer shrink-0"
              aria-label="بستن"
            >
              <X className="size-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
