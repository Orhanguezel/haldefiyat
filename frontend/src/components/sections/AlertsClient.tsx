"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchMarkets, fetchProducts, type Market, type Product } from "@/lib/api";
import AlertModalForm from "@/components/ui/alert/AlertModalForm";
import { INITIAL_FORM, type AlertFormState } from "@/components/ui/alert/types";

const API_BASE =
  (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8088").replace(/\/$/, "") + "/api/v1";

type SubmitState = "idle" | "loading" | "success" | { error: string };

export default function AlertsClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [form, setForm] = useState<AlertFormState>(INITIAL_FORM);
  const [state, setState] = useState<SubmitState>("idle");

  useEffect(() => {
    fetchProducts().then(setProducts).catch(() => null);
    fetchMarkets().then(setMarkets).catch(() => null);
  }, []);

  const onChange = useCallback(
    <K extends keyof AlertFormState>(key: K, value: AlertFormState[K]) =>
      setForm((prev) => ({ ...prev, [key]: value })),
    [],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    try {
      const body: Record<string, unknown> = {
        productSlug: form.productSlug,
        direction: form.direction,
        thresholdPrice: parseFloat(form.thresholdPrice),
      };
      if (form.marketSlug) body.marketSlug = form.marketSlug;
      
      if (form.channel === "email") {
        body.contactEmail = form.contactEmail;
      } else if (form.channel === "telegram") {
        body.contactTelegram = form.contactTelegram;
      } else if (form.channel === "push") {
        // OneSignal SDK üzerinden PlayerID alınıp gönderilir
        const OneSignal = (window as any).OneSignal;
        if (OneSignal?.User?.PushSubscription?.id) {
          body.contactPush = OneSignal.User.PushSubscription.id;
        } else {
          setState({ error: "Web bildirimi için tarayıcı onayı alınamadı. Lütfen bildirimlere izin verin." });
          return;
        }
      }

      const res = await fetch(`${API_BASE}/alerts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setState({ error: data.message ?? "Bir hata oluştu." });
        return;
      }
      setState("success");
      setForm(INITIAL_FORM);
    } catch {
      setState({ error: "Sunucuya ulaşılamadı. Lütfen tekrar deneyin." });
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
      {/* Açıklama */}
      <div className="space-y-6">
        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-6">
          <h2 className="font-(family-name:--font-display) text-lg font-semibold text-(--color-foreground)">
            Nasıl Çalışır?
          </h2>
          <ol className="mt-4 space-y-3 text-[13px] text-(--color-muted)">
            <li className="flex gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-(--color-brand)/15 text-[11px] font-bold text-(--color-brand)">
                1
              </span>
              Takip etmek istediğiniz ürün ve hali seçin.
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-(--color-brand)/15 text-[11px] font-bold text-(--color-brand)">
                2
              </span>
              Hedef fiyat ve yönü belirleyin: fiyat altına düşünce mi yoksa üstüne çıkınca mı bildirim almak istiyorsunuz?
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-(--color-brand)/15 text-[11px] font-bold text-(--color-brand)">
                3
              </span>
              E-posta, Telegram veya Web Push tercihini seçin. Her sabah hal verileri güncellenirken uyarılar kontrol edilir.
            </li>
          </ol>
        </div>

        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-6">
          <h2 className="font-(family-name:--font-display) text-lg font-semibold text-(--color-foreground)">
            Sık Sorulan Sorular
          </h2>
          <div className="mt-4 space-y-4 text-[13px]">
            <div>
              <p className="font-semibold text-(--color-foreground)">
                Uyarılar ne zaman tetiklenir?
              </p>
              <p className="mt-1 text-(--color-muted)">
                Her sabah 09:30&apos;da hal verileri çekildikten sonra tüm
                uyarılar kontrol edilir. Aynı uyarı 24 saat içinde en fazla
                bir kez tetiklenir.
              </p>
            </div>
            <div>
              <p className="font-semibold text-(--color-foreground)">
                Uyarımı nasıl iptal ederim?
              </p>
              <p className="mt-1 text-(--color-muted)">
                Gönderilen bildirim e-postasındaki &quot;Uyarıyı İptal Et&quot;
                bağlantısına tıklayın. Hesap gerekmez.
              </p>
            </div>
            <div>
              <p className="font-semibold text-(--color-foreground)">
                Kaç uyarı oluşturabilirim?
              </p>
              <p className="mt-1 text-(--color-muted)">
                Şu an sınırsız uyarı oluşturabilirsiniz. Kullanıcı hesapları
                devreye girdiğinde kişisel uyarı yönetimi de eklenecek.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-6">
        <h2 className="mb-5 font-(family-name:--font-display) text-lg font-semibold text-(--color-foreground)">
          Yeni Uyarı Oluştur
        </h2>

        {state === "success" ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-(--color-success)/15 text-3xl">
              ✓
            </div>
            <p className="font-semibold text-(--color-foreground)">Uyarı Oluşturuldu</p>
            <p className="text-[13px] text-(--color-muted)">
              Fiyat hedef eşiğe ulaştığında bildirim alacaksınız.
            </p>
            <button
              onClick={() => setState("idle")}
              className="mt-2 rounded-lg bg-(--color-brand) px-5 py-2 text-[13px] font-semibold text-(--color-navy) transition-opacity hover:opacity-90"
            >
              Yeni Uyarı Ekle
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <AlertModalForm
              form={form}
              onChange={onChange}
              products={products}
              markets={markets}
            />
            {typeof state === "object" && (
              <p className="rounded-lg bg-(--color-danger)/10 px-3 py-2 text-[12px] text-(--color-danger)">
                {state.error}
              </p>
            )}
            <button
              type="submit"
              disabled={state === "loading"}
              className="mt-1 h-10 w-full rounded-lg bg-(--color-brand) text-[13px] font-semibold text-(--color-navy) transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {state === "loading" ? "Kaydediliyor..." : "Uyarı Oluştur"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
