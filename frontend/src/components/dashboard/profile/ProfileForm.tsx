"use client";

import { useEffect, useState } from "react";
import { useProfile } from "@/lib/hooks/useProfile";
import { useToast } from "@/components/providers/ToastProvider";
import { Skeleton } from "@/components/ui/Skeleton";

type FormState = {
  full_name: string;
  phone: string;
  city: string;
  address_line1: string;
  bio: string;
};

export function ProfileForm() {
  const { data, loading, update } = useProfile();
  const toast = useToast();
  const [form, setForm] = useState<FormState>({
    full_name: "", phone: "", city: "", address_line1: "", bio: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) {
      setForm({
        full_name:    data.full_name    ?? "",
        phone:        data.phone        ?? "",
        city:         data.city         ?? "",
        address_line1: data.address_line1 ?? "",
        bio:          data.bio          ?? "",
      });
    }
  }, [data]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await update(form);
      toast.success("Profiliniz kaydedildi.");
    } catch {
      toast.error("Kaydedilemedi. Lütfen tekrar deneyin.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 rounded-xl border border-(--color-border) bg-(--color-surface) p-6">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-(--color-border) bg-(--color-surface) p-6 space-y-5">
      <h2 className="font-(family-name:--font-display) text-base font-semibold text-(--color-foreground)">
        Kişisel Bilgiler
      </h2>

      <Field label="Ad Soyad">
        <input
          type="text"
          value={form.full_name}
          onChange={(e) => setForm((s) => ({ ...s, full_name: e.target.value }))}
          placeholder="Adınız ve soyadınız"
          className={inputCls}
        />
      </Field>

      <Field label="Telefon">
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
          placeholder="+90 5xx xxx xx xx"
          className={inputCls}
        />
      </Field>

      <Field label="Şehir">
        <input
          type="text"
          value={form.city}
          onChange={(e) => setForm((s) => ({ ...s, city: e.target.value }))}
          placeholder="İstanbul"
          className={inputCls}
        />
      </Field>

      <Field label="Adres">
        <input
          type="text"
          value={form.address_line1}
          onChange={(e) => setForm((s) => ({ ...s, address_line1: e.target.value }))}
          placeholder="Sokak / Mahalle"
          className={inputCls}
        />
      </Field>

      <Field label="Hakkımda">
        <textarea
          value={form.bio}
          onChange={(e) => setForm((s) => ({ ...s, bio: e.target.value }))}
          rows={3}
          placeholder="Kısa bir tanıtım..."
          className={`${inputCls} resize-none`}
        />
      </Field>

      <button
        type="submit"
        disabled={saving}
        className="h-10 w-full rounded-lg bg-(--color-brand) text-[13px] font-semibold text-(--color-navy) transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {saving ? "Kaydediliyor..." : "Kaydet"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[12px] font-medium text-(--color-muted)">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-(--color-border) bg-(--color-background) px-3 py-2 text-[13px] text-(--color-foreground) placeholder:text-(--color-muted) outline-none focus:border-(--color-brand) transition-colors";
