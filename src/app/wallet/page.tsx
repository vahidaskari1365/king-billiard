import type { Metadata } from "next";
import WalletClient from "./WalletClient";

export const metadata: Metadata = {
  title: "کیف پول",
  description: "شارژ کیف پول و مدیریت سکه‌ها و جواهرهای کیوورس",
};

export default function WalletPage() {
  return (
    <main className="min-h-dvh">
      <WalletClient />
    </main>
  );
}
