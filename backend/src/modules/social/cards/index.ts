/**
 * Kart ailesi giris noktasi: secim + cizim + metin, tek yerde.
 *
 * Telegram, WhatsApp ve (Tanitio uzerinden) Facebook/Instagram ayni karti kullanir;
 * metin sablonludur, LLM yoktur — onceki AI metinleri "Limon Konya'da %60 dustu"
 * gibi tek hal kaydini ulusal gercek gibi sunuyordu.
 */
import { renderBasketCard, renderMoversCard, uploadCard, type CardSize } from "./render";
import { selectBasket, selectMovers, type BasketRow, type MoverRow } from "./select";

export type CardSeries = "k1" | "k2";
export const CARD_SERIES: CardSeries[] = ["k1", "k2"];

export interface CardPayload {
  series: CardSeries; size: CardSize; imageUrl: string | null;
  caption: string; hashtags: string; link: string;
  contentKey: string; recordedDate: string; itemCount: number;
}

const SITE = "https://haldefiyat.com";
const HASHTAGS = "#HalFiyatları #HaldeFiyat #SebzeMeyve";
const fmtPrice = (v: number) => v.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtPct = (v: number) => Math.abs(v).toLocaleString("tr-TR", { maximumFractionDigits: 1 });

function dateLabel(iso: string): string {
  if (!iso) return "";
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Istanbul" });
}

/** Ilk iki satirda link: WhatsApp ve Instagram altyaziyi katlar, link asagida kalirsa gorunmez. */
function moversCaption(risers: MoverRow[], fallers: MoverRow[], date: string): string {
  const lead = risers[0] ?? fallers[0];
  const head = lead
    ? `${lead.productName} ${lead.cityName} halinde ${lead.changePct >= 0 ? "%" + fmtPct(lead.changePct) + " arttı" : "%" + fmtPct(lead.changePct) + " ucuzladı"}: ₺${fmtPrice(lead.latest)}/kg.`
    : "Günün hal hareketleri.";
  const lines = [
    head,
    `Tüm liste → ${SITE}/fiyatlar`,
    "",
    ...risers.slice(0, 3).map((r) => `▲ ${r.productName} ₺${fmtPrice(r.latest)} (%${fmtPct(r.changePct)}) · ${r.cityName}`),
    ...fallers.slice(0, 3).map((r) => `▼ ${r.productName} ₺${fmtPrice(r.latest)} (%${fmtPct(r.changePct)}) · ${r.cityName}`),
    "",
    `${dateLabel(date)} · belediye halleri ve HKS kayıtları`,
  ];
  return lines.join("\n");
}

function basketCaption(items: BasketRow[], date: string): string {
  const up = items.filter((i) => (i.weekChangePct ?? 0) > 2).length;
  const down = items.filter((i) => (i.weekChangePct ?? 0) < -2).length;
  const summary = up || down
    ? `Bu hafta sepette ${up} ürün zamlandı, ${down} ürün ucuzladı.`
    : "Bu hafta sepette belirgin hareket yok.";
  return [
    summary,
    `Günlük fiyatlar → ${SITE}/fiyatlar`,
    "",
    ...items.slice(0, 6).map((i) => `${i.productName}: ₺${fmtPrice(i.price)}/kg${i.weekChangePct == null ? "" : ` (${i.weekChangePct > 0 ? "+" : ""}%${fmtPct(i.weekChangePct)})`}`),
    "",
    `${dateLabel(date)} · ${items[0]?.markets ?? 0}+ halden ortalama`,
  ].join("\n");
}

export async function buildCard(series: CardSeries, size: CardSize): Promise<CardPayload | null> {
  if (series === "k1") {
    const { risers, fallers, date } = await selectMovers(5);
    if (!risers.length && !fallers.length) return null;
    const png = await renderMoversCard(risers, fallers, size, dateLabel(date));
    const imageUrl = await uploadCard(png, `k1-${date}-${size}`);
    return {
      series, size, imageUrl, caption: moversCaption(risers, fallers, date),
      hashtags: HASHTAGS, link: `${SITE}/fiyatlar`,
      contentKey: `k1:${date}`, recordedDate: date, itemCount: risers.length + fallers.length,
    };
  }
  const { items, date } = await selectBasket();
  if (!items.length) return null;
  const png = await renderBasketCard(items, size, dateLabel(date));
  const imageUrl = await uploadCard(png, `k2-${date}-${size}`);
  return {
    series, size, imageUrl, caption: basketCaption(items, date),
    hashtags: `${HASHTAGS} #Pazar`, link: `${SITE}/fiyatlar`,
    contentKey: `k2:${date}`, recordedDate: date, itemCount: items.length,
  };
}

export { selectBasket, selectMovers } from "./select";
export type { CardSize } from "./render";
