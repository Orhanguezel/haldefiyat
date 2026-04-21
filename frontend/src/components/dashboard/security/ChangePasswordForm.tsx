"use client";

import { useState } from "react";
import { apiPost } from "@/lib/api-client";
import { useAuthSession } from "@/components/providers/AuthSessionProvider";
import { useToast } from "@/components/providers/ToastProvider";

export function ChangePasswordForm() {
  const { user } = useAuthSession();
  const toast = useToast();
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.next.length < 8) {
      setError("Yeni şifre en az 8 karakter olmalı.");
      return;
    }
    if (form.next !== form.confirm) {
      setError("Yeni şifreler eşleşmiyor.");
      return;
    }
    setSaving(true);
    try {
      await apiPost("/user/change-password", {
        currentPassword: form.current,
        newPassword: form.next,
      });
      toast.success("Şifreniz başarıyla güncellendi.");
      setForm({ current: "", next: "", confirm: "" });
    } catch (err: unknown) {
      const msg = (err as { code?: string })?.code;
      toast.error(msg === "Mevcut sifre yanlis" ? "Mevcut şifre yanlış." : "Güncellenemedi. Tekrar deneyin.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* E-posta bilgisi */}
      <div className="rounded-xl border border-(--color-border) bg-(--color-surface) px-5 py-4">
        <p className="text-[12px] font-medium text-(--color-muted)">E-posta adresi</p>
        <p className="mt-1 text-[13px] text-(--color-foreground)">{user?.email}</p>
        {user?.email_verified ? (
          <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[11px] font-medium text-green-600">
            ✓ Doğrulandı
          </span>
        ) : (
          <span className="mt-1.5 inline-flex items-center rounded-full bg-(--color-danger)/10 px-2 py-0.5 text-[11px] font-medium text-(--color-danger)">
            Doğrulanmadı
          </span>
        )}
      </div>

      {/* Şifre değiştir */}
      <form onSubmit={handleSubmit} className="rounded-xl border border-(--color-border) bg-(--color-surface) p-6 space-y-5">
        <h2 className="font-(family-name:--font-display) text-base font-semibold text-(--color-foreground)">
          Şifre Değiştir
        </h2>

        {[
          { key: "current", label: "Mevcut Şifre", placeholder: "••••••••" },
          { key: "next",    label: "Yeni Şifre",   placeholder: "En az 8 karakter" },
          { key: "confirm", label: "Yeni Şifre (Tekrar)", placeholder: "••••••••" },
        ].map(({ key, label, placeholder }) => (
          <div key={key} className="space-y-1.5">
            <label className="block text-[12px] font-medium text-(--color-muted)">{label}</label>
            <input
              type="password"
              value={form[key as keyof typeof form]}
              onChange={(e) => setForm((s) => ({ ...s, [key]: e.target.value }))}
              placeholder={placeholder}
              className="w-full rounded-lg border border-(--color-border) bg-(--color-background) px-3 py-2 text-[13px] text-(--color-foreground) outline-none focus:border-(--color-brand) transition-colors"
            />
          </div>
        ))}

        {error && (
          <p className="rounded-lg bg-(--color-danger)/10 px-3 py-2 text-[12px] text-(--color-danger)">{error}</p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="h-10 w-full rounded-lg bg-(--color-brand) text-[13px] font-semibold text-(--color-navy) transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Güncelleniyor..." : "Şifreyi Güncelle"}
        </button>
      </form>
    </div>
  );
}
