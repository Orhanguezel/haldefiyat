"use client";

import { useState } from "react";
import { apiPost } from "@/lib/api-client";
import { useToast } from "@/components/providers/ToastProvider";

export function NewTicketForm({ onCreated }: { onCreated?: () => void }) {
  const toast = useToast();
  const [form, setForm] = useState({ subject: "", message: "" });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await apiPost("/support/tickets", {
        subject: form.subject,
        message: form.message,
        category: "general",
      });
      toast.success("Talebiniz alındı. En kısa sürede dönüş yapılacak.");
      setForm({ subject: "", message: "" });
      onCreated?.();
    } catch {
      toast.error("Gönderilemedi. Tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-(--color-border) bg-(--color-surface) p-6 space-y-4">
      <h2 className="font-(family-name:--font-display) text-base font-semibold text-(--color-foreground)">
        Yeni Destek Talebi
      </h2>

      <div className="space-y-1.5">
        <label className="block text-[12px] font-medium text-(--color-muted)">Konu</label>
        <input
          type="text"
          required
          value={form.subject}
          onChange={(e) => setForm((s) => ({ ...s, subject: e.target.value }))}
          placeholder="Sorunuzu özetleyin"
          className={inputCls}
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-[12px] font-medium text-(--color-muted)">Mesaj</label>
        <textarea
          required
          rows={4}
          value={form.message}
          onChange={(e) => setForm((s) => ({ ...s, message: e.target.value }))}
          placeholder="Detaylı açıklayın..."
          className={`${inputCls} resize-none`}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="h-10 w-full rounded-lg bg-(--color-brand) text-[13px] font-semibold text-(--color-navy) transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Gönderiliyor..." : "Talebi Gönder"}
      </button>
    </form>
  );
}

const inputCls =
  "w-full rounded-lg border border-(--color-border) bg-(--color-background) px-3 py-2 text-[13px] text-(--color-foreground) placeholder:text-(--color-muted) outline-none focus:border-(--color-brand) transition-colors";
