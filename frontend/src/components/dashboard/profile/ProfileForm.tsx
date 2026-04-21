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
      toast.success("Profiliniz başarıyla kaydedildi.");
    } catch {
      toast.error("Profil kaydedilirken bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 rounded-2xl border border-(--color-border-soft) bg-(--color-surface) p-8 shadow-sm">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-12 w-full" />
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-12 w-full" /></div>
          <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-12 w-full" /></div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="overflow-hidden rounded-2xl border border-(--color-border-soft) bg-(--color-surface) shadow-sm transition-all hover:shadow-md">
      <div className="border-b border-(--color-border-soft) bg-(--color-bg-alt)/30 px-8 py-5">
        <h2 className="text-lg font-bold text-(--color-foreground)">
          Kişisel Bilgiler
        </h2>
        <p className="mt-1 text-[13px] text-(--color-muted)">Hesap bilgilerini buradan yönetebilirsiniz.</p>
      </div>

      <div className="space-y-6 p-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
        </div>

        <Field label="Hakkımda">
          <textarea
            value={form.bio}
            onChange={(e) => setForm((s) => ({ ...s, bio: e.target.value }))}
            rows={4}
            placeholder="Kısa bir tanıtım..."
            className={`${inputCls} resize-none`}
          />
        </Field>

        <div className="flex items-center justify-end border-t border-(--color-border-soft) pt-6">
          <button
            type="submit"
            disabled={saving}
            className="group flex h-11 items-center gap-2 rounded-xl bg-brand px-10 text-[14px] font-bold text-white shadow-lg shadow-brand/20 transition-all hover:scale-[1.02] hover:bg-brand-dark active:scale-95 disabled:opacity-50"
          >
            {saving ? (
               <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : null}
            <span>{saving ? "Kaydediliyor..." : "Profilimi Güncelle"}</span>
          </button>
        </div>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-[13px] font-semibold text-(--color-muted) ml-1">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-(--color-border-soft) bg-(--color-background) px-4 py-3 text-[14px] text-(--color-foreground) placeholder:text-(--color-muted)/60 outline-none focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all";
