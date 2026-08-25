import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import PWARegister from "@/components/pwa/PWARegister";

export const metadata: Metadata = {
  title: {
    default: "کیوورس | بازی بیلیارد آنلاین سه‌بعدی",
    template: "%s | کیوورس",
  },
  description:
    "کیوورس — پلتفرم بازی بیلیارد سه‌بعدی با گرافیک خیره‌کننده. اسنوکر، ۸ توپ، ۹ توپ، بازی با هوش مصنوعی یا دوستان، کیف پول و فروشگاه آیتم. قابل نصب روی اندروید و iOS.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "کیوورس",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0d1a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body className="bg-bg text-ink antialiased min-h-dvh">
        {children}
        <PWARegister />
      </body>
    </html>
  );
}
