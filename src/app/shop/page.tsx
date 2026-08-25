import type { Metadata } from "next";
import ShopClient from "./ShopClient";

export const metadata: Metadata = {
  title: "فروشگاه",
  description: "خرید کیو، میز و گونه با ارز دیجیتال داخلی کیوورس",
};

export default function ShopPage() {
  return (
    <main className="min-h-dvh">
      <ShopClient />
    </main>
  );
}
