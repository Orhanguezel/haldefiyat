"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuthSession } from "@/components/providers/AuthSessionProvider";
import { apiDelete, apiGet, apiPost } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type KeyItem = {
  id: number;
  keyPrefix?: string | null;
  name?: string | null;
  tier: "free" | "pro";
  dailyLimit: number;
  usedToday?: number;
  revoked?: boolean;
  createdAt?: string;
};

export default function ApiKeyOnboarding() {
  const { user, loading: authLoading } = useAuthSession();
  const [items, setItems] = useState<KeyItem[]>([]);
  const [name, setName] = useState("Production");
  const [rawKey, setRawKey] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  useEffect(() => {
    if (!user) return;
    setStatus("loading");
    apiGet<{ items: KeyItem[] }>("/keys")
      .then((result) => setItems(result.items ?? []))
      .catch(() => setStatus("error"))
      .finally(() => setStatus((current) => current === "error" ? "error" : "idle"));
  }, [user]);

  async function createKey(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setRawKey(null);
    try {
      const result = await apiPost<{ key: KeyItem & { rawKey: string } }>("/keys", { name: name.trim() || "Production" });
      setRawKey(result.key.rawKey);
      setItems((current) => [result.key, ...current]);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  async function revoke(id: number) {
    setStatus("loading");
    try {
      await apiDelete<{ ok: boolean }>(`/keys/${id}`);
      setItems((current) => current.map((item) => item.id === id ? { ...item, revoked: true } : item));
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  if (authLoading) return <p className="text-sm text-(--color-muted)">Hesap durumu kontrol ediliyor…</p>;
  if (!user) {
    return (
      <div className="rounded-[8px] border border-(--color-border) bg-(--color-bg-alt) p-5">
        <h3 className="font-bold text-(--color-foreground)">Anahtar oluşturmak için giriş yapın</h3>
        <p className="mt-2 text-sm leading-6 text-(--color-muted)">Ücretsiz hesapla anahtarınızı kendiniz oluşturabilir, durumunu görebilir ve iptal edebilirsiniz.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/giris?next=%2Fpro%23api-key" className="rounded-[6px] bg-(--color-brand) px-4 py-2 text-sm font-semibold text-(--color-brand-fg)">Giriş yap</Link>
          <Link href="/kayit" className="rounded-[6px] border border-(--color-border) px-4 py-2 text-sm font-semibold text-(--color-foreground)">Hesap oluştur</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <form onSubmit={createKey} className="grid gap-3 rounded-[8px] border border-(--color-border) bg-(--color-surface) p-5 sm:grid-cols-[1fr_auto] sm:items-end">
        <Input label="Anahtar adı" value={name} onChange={(event) => setName(event.target.value)} maxLength={80} required />
        <Button type="submit" loading={status === "loading"}>Yeni anahtar oluştur</Button>
      </form>
      {rawKey && (
        <div role="status" className="rounded-[8px] border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>Bu anahtar yalnız bir kez gösterilir.</strong>
          <code className="mt-2 block overflow-x-auto rounded bg-white p-3 text-xs">{rawKey}</code>
        </div>
      )}
      {status === "error" && <p role="alert" className="text-sm text-danger">Anahtar işlemi tamamlanamadı. Aktif anahtar sınırını ve oturumunuzu kontrol edin.</p>}
      <div className="space-y-2">
        {items.length === 0 ? (
          <p className="rounded-[8px] border border-dashed border-(--color-border) p-5 text-sm text-(--color-muted)">Aktif API anahtarınız yok.</p>
        ) : items.map((item) => (
          <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-(--color-border) bg-(--color-surface) p-4">
            <div>
              <p className="font-semibold text-(--color-foreground)">{item.name || "API anahtarı"}</p>
              <p className="mt-1 font-(family-name:--font-mono) text-xs text-(--color-muted)">{item.keyPrefix || "hf_…"} · {item.tier.toUpperCase()} · {item.revoked ? "İptal edildi" : "Aktif"}</p>
              <p className="mt-1 text-xs text-(--color-muted)">Bugün {Number(item.usedToday ?? 0).toLocaleString("tr-TR")} / {item.dailyLimit.toLocaleString("tr-TR")} istek</p>
            </div>
            {!item.revoked && <button type="button" onClick={() => revoke(item.id)} disabled={status === "loading"} className="min-h-11 rounded-[6px] border border-red-300 px-3 text-xs font-semibold text-red-700 disabled:opacity-60">İptal et</button>}
          </div>
        ))}
      </div>
    </div>
  );
}
