import type { Metadata } from "next";
import BilliardsGame from "@/components/game/BilliardsGame";

export const metadata: Metadata = {
  title: "میز بازی",
  description: "بازی بیلیارد سه‌بعدی — اسنوکر، ۸ توپ، ۹ توپ",
};

export default function PlayPage() {
  return (
    <main className="h-dvh overflow-hidden">
      <BilliardsGame />
    </main>
  );
}
