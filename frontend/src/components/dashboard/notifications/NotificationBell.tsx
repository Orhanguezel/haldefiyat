"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api-client";
import { getStoredAccessToken } from "@/lib/auth-token";

interface Props { locale: string }

export function NotificationBell({ locale }: Props) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!getStoredAccessToken()) return;
    apiGet<{ count: number }>("/notifications/unread-count")
      .then((r) => setCount(r.count))
      .catch(() => null);
  }, []);

  return (
    <Link
      href={`/${locale}/hesabim/bildirimler`}
      className="relative flex h-8 w-8 items-center justify-center rounded-lg text-(--color-muted) hover:text-(--color-foreground) transition-colors"
      aria-label="Bildirimler"
    >
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
        <path d="M10 2.5a5.5 5.5 0 0 1 5.5 5.5v3l1.5 2H3l1.5-2V8A5.5 5.5 0 0 1 10 2.5z" />
        <path d="M8 16.5a2 2 0 0 0 4 0" strokeLinecap="round" />
      </svg>
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-(--color-brand) text-[9px] font-bold text-(--color-navy)">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
