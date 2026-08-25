"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-dvh flex items-center justify-center px-4 bg-bg text-ink">
      <div className="text-center max-w-md glass rounded-3xl p-8">
        <div className="font-display text-3xl mb-3">خطایی رخ داد</div>
        <p className="text-muted text-sm mb-6 leading-7">
          متأسفانه مشکلی پیش آمده. لطفاً دوباره تلاش کنید.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => reset()} className="btn-primary">
            تلاش مجدد
          </button>
          <Link href="/" className="btn-ghost">
            خانه
          </Link>
        </div>
        {error.digest && (
          <p className="text-[11px] text-muted mt-6 font-latin">{error.digest}</p>
        )}
      </div>
    </main>
  );
}
