import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-dvh flex items-center justify-center px-4 bg-bg text-ink">
      <div className="text-center max-w-md">
        <div className="font-display text-6xl mb-4 text-gradient-gold">۴۰۴</div>
        <h1 className="font-display text-2xl mb-3">صفحه پیدا نشد</h1>
        <p className="text-muted text-sm mb-8 leading-7">
          متأسفانه صفحه‌ای که دنبالش می‌گردید وجود ندارد یا جابجا شده است.
        </p>
        <Link href="/" className="btn-primary">
          بازگشت به خانه
        </Link>
      </div>
    </main>
  );
}
