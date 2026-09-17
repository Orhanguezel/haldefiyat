"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api-client";

/**
 * Ilan sahibine gelen mesaj/teklifler.
 *
 * Bu veri bugune kadar yalniz admin panelinde ve ops Telegram kanalinda
 * gorunuyordu; ilani veren kisi kendisine gelen teklifi HICBIR yerde
 * goremiyordu (17 Eyl 2026). Pazaryerinin temel islevi bu: alici teklif
 * birakiyor, satici gormuyorsa teklif yok hukmunde.
 */

type Inquiry = {
  id: number;
  name: string | null;
  phone: string | null;
  message: string | null;
  offerPrice: string | number | null;
  status: "new" | "contacted" | "closed";
  createdAt: string;
};

const tr = (value: number) =>
  value.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function tarih(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("tr-TR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
}

export function ListingInquiries({ listingId }: { listingId: number }) {
  const [items, setItems] = useState<Inquiry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let iptal = false;
    apiGet<{ items: Inquiry[] }>(`/listings/me/${listingId}/inquiries`)
      .then((result) => { if (!iptal) setItems(result.items ?? []); })
      .catch(() => { if (!iptal) setError("Mesajlar yüklenemedi. Sayfayı yenileyip tekrar deneyin."); });
    return () => { iptal = true; };
  }, [listingId]);

  if (error) {
    return (
      <section className="rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
        <h2 className="text-base font-semibold text-foreground">Gelen mesajlar</h2>
        <p className="mt-2 text-sm text-(--color-danger)" role="alert">{error}</p>
      </section>
    );
  }

  if (items === null) {
    return (
      <section className="rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
        <h2 className="text-base font-semibold text-foreground">Gelen mesajlar</h2>
        <p className="mt-2 text-sm text-(--color-muted)">Yükleniyor…</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">
          Gelen mesajlar{items.length ? ` (${items.length})` : ""}
        </h2>
      </div>

      {items.length === 0 ? (
        <p className="mt-2 text-sm text-(--color-muted)">
          Bu ilana henüz mesaj gelmedi. Alıcılar ilan sayfanızdaki formdan teklif bırakabilir;
          geldiğinde telefon numarasıyla birlikte burada görünür.
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {items.map((item) => {
            const teklif = item.offerPrice == null ? null : Number(item.offerPrice);
            return (
              <li key={item.id} className="rounded-lg border border-(--color-border) bg-(--color-bg-alt) p-3">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <span className="text-sm font-semibold text-foreground">{item.name || "İsim belirtilmedi"}</span>
                  <span className="text-xs text-(--color-muted)">{tarih(item.createdAt)}</span>
                </div>

                {teklif != null && Number.isFinite(teklif) ? (
                  <p className="mt-1 text-sm font-bold text-(--color-brand)">Teklif: {tr(teklif)} TL</p>
                ) : null}

                {item.message ? (
                  <p className="mt-1 whitespace-pre-line text-sm text-(--color-foreground)">{item.message}</p>
                ) : null}

                {item.phone ? (
                  <a
                    href={`tel:${item.phone.replace(/[^0-9+]/g, "")}`}
                    className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-lg bg-(--color-brand) px-4 text-sm font-bold text-(--color-brand-fg)"
                  >
                    {item.phone} · Ara
                  </a>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
