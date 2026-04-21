"use client";

import { useNotifications } from "@/lib/hooks/useNotifications";
import { Skeleton } from "@/components/ui/Skeleton";

export function NotificationList() {
  const { items, loading, error, unreadCount, markRead, markAllRead } = useNotifications();

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  }

  if (error) {
    return <p className="text-[13px] text-(--color-danger)">{error}</p>;
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-8 text-center">
        <p className="text-[13px] text-(--color-muted)">Bildirim bulunmuyor.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {unreadCount > 0 && (
        <div className="flex justify-end">
          <button
            onClick={markAllRead}
            className="text-[12px] text-(--color-brand) hover:underline"
          >
            Tümünü okundu işaretle
          </button>
        </div>
      )}

      {items.map((n) => (
        <div
          key={n.id}
          className={`flex items-start gap-4 rounded-xl border px-5 py-4 transition-colors ${
            n.is_read
              ? "border-(--color-border) bg-(--color-surface)"
              : "border-(--color-brand)/30 bg-(--color-brand)/5"
          }`}
        >
          <div className="flex-1 min-w-0">
            <p className={`text-[13px] font-medium ${n.is_read ? "text-(--color-foreground)" : "text-(--color-brand)"}`}>
              {n.title}
            </p>
            <p className="mt-0.5 text-[12px] text-(--color-muted) line-clamp-2">{n.message}</p>
            <p className="mt-1 text-[11px] text-(--color-muted)">
              {new Date(n.created_at).toLocaleString("tr-TR")}
            </p>
          </div>
          {!n.is_read && (
            <button
              onClick={() => markRead(n.id)}
              className="shrink-0 rounded-lg border border-(--color-border) px-3 py-1 text-[11px] font-medium text-(--color-muted) hover:bg-(--color-border)/50 transition-colors"
            >
              Okundu
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
