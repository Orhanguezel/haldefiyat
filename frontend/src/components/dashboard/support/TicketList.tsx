"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet } from "@/lib/api-client";
import { TicketDetail } from "./TicketDetail";
import { Skeleton } from "@/components/ui/Skeleton";

type Ticket = {
  id: number;
  subject: string;
  status: "open" | "answered" | "closed";
  priority: string;
  created_at: string;
  updated_at: string;
};

const STATUS_LABEL: Record<string, string> = {
  open: "Açık",
  answered: "Yanıtlandı",
  closed: "Kapalı",
};
const STATUS_COLOR: Record<string, string> = {
  open: "text-amber-600 bg-amber-500/10",
  answered: "text-green-600 bg-green-500/10",
  closed: "text-(--color-muted) bg-(--color-border)/50",
};

interface Props { locale: string }

export function TicketList({ locale }: Props) {
  const [items, setItems] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet<{ items: Ticket[] }>("/support/tickets/my");
      setItems(res.items ?? []);
    } catch {
      // sessizce
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetch(); }, [fetch]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  }

  if (selected !== null) {
    return <TicketDetail ticketId={selected} onBack={() => { setSelected(null); void fetch(); }} />;
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-6 text-center">
        <p className="text-[13px] text-(--color-muted)">Destek talebiniz bulunmuyor.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="font-(family-name:--font-display) text-base font-semibold text-(--color-foreground)">
        Taleplerim
      </h2>
      {items.map((t) => (
        <button
          key={t.id}
          onClick={() => setSelected(t.id)}
          className="w-full flex items-center justify-between gap-4 rounded-xl border border-(--color-border) bg-(--color-surface) px-5 py-4 text-left hover:bg-(--color-border)/30 transition-colors"
        >
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-(--color-foreground)">{t.subject}</p>
            <p className="mt-0.5 text-[11px] text-(--color-muted)">
              {new Date(t.updated_at).toLocaleDateString("tr-TR")}
            </p>
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${STATUS_COLOR[t.status] ?? ""}`}>
            {STATUS_LABEL[t.status] ?? t.status}
          </span>
        </button>
      ))}
    </div>
  );
}
