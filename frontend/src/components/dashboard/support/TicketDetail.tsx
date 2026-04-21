"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/Skeleton";

type Message = {
  id: number;
  sender_type: "user" | "staff";
  body: string;
  created_at: string;
};

interface Props {
  ticketId: number;
  onBack: () => void;
}

export function TicketDetail({ ticketId, onBack }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet<{ items: Message[] }>(`/support/tickets/${ticketId}/messages`);
      setMessages(res.items ?? []);
    } catch {
      // sessizce
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => { void fetch(); }, [fetch]);

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    try {
      await apiPost(`/support/tickets/${ticketId}/messages`, { body: reply });
      setReply("");
      await fetch();
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-[13px] text-(--color-muted) hover:text-(--color-foreground) transition-colors"
      >
        ← Geri
      </button>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`rounded-xl border px-5 py-4 ${
                m.sender_type === "user"
                  ? "ml-8 border-(--color-brand)/20 bg-(--color-brand)/5"
                  : "mr-8 border-(--color-border) bg-(--color-surface)"
              }`}
            >
              <p className="text-[12px] font-medium text-(--color-muted) mb-1.5">
                {m.sender_type === "user" ? "Siz" : "Destek Ekibi"} ·{" "}
                {new Date(m.created_at).toLocaleString("tr-TR")}
              </p>
              <p className="text-[13px] text-(--color-foreground) whitespace-pre-wrap">{m.body}</p>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleReply} className="rounded-xl border border-(--color-border) bg-(--color-surface) p-4 space-y-3">
        <textarea
          rows={3}
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Yanıtınızı yazın..."
          className="w-full rounded-lg border border-(--color-border) bg-(--color-background) px-3 py-2 text-[13px] text-(--color-foreground) outline-none focus:border-(--color-brand) resize-none transition-colors"
        />
        <button
          type="submit"
          disabled={sending || !reply.trim()}
          className="h-9 w-full rounded-lg bg-(--color-brand) text-[13px] font-semibold text-(--color-navy) transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {sending ? "Gönderiliyor..." : "Yanıtla"}
        </button>
      </form>
    </div>
  );
}
