/**
 * Kart ailesi giris noktasi: secim + cizim + metin, tek yerde.
 *
 * Telegram, WhatsApp ve (Tanitio uzerinden) Facebook/Instagram ayni karti kullanir;
 * metin sablonludur, LLM yoktur — onceki AI metinleri "Limon Konya'da %60 dustu"
 * gibi tek hal kaydini ulusal gercek gibi sunuyordu.
 */
import { renderBasketCard, renderCityCard, renderGapCard, renderMoversCard, uploadCard, type CardSize } from "./render";
import { selectBasket, selectCityCompare, selectHalToMarket, selectMovers, type BasketRow, type CityCompare, type GapRow, type MoverRow } from "./select";

export type CardSeries = "k1" | "k2" | "k3" | "k4";
export const CARD_SERIES: CardSeries[] = ["k1", "k2", "k3", "k4"];

export interface CardPayload {
  series: CardSeries; size: CardSize; imageUrl: string | null;
  caption: string; hashtags: string; link: string;
  contentKey: string; recordedDate: string; itemCount: number;
}

const SITE = "https://haldefiyat.com";
const HASHTAGS = "#HalFiyatları #HaldeFiyat #SebzeMeyve";
const fmtPrice = (v: number) => v.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtPct = (v: number) => Math.abs(v).toLocaleString("tr-TR", { maximumFractionDigits: 1 });
/** Isaretli yuzde: eksi degerlerde de isaret gorunur ("−%12,4"). */
const signed = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}%${fmtPct(v)}`;

/**
 * Bulunma eki: "Konya'da", "Denizli'de", "Tokat'ta".
 * Sehir adini duz metne gomerken tek tek yazmak yerine ses uyumundan turetilir.
 */
export function locative(name: string): string {
  const clean = name.trim();
  const lower = clean.toLocaleLowerCase("tr-TR");
  const vowels = [...lower].filter((ch) => "aeıioöuü".includes(ch));
  const last = vowels[vowels.length - 1] ?? "a";
  const back = "aıou".includes(last);
  const voiceless = "fstkçşhp".includes(lower[lower.length - 1] ?? "");
  const suffix = voiceless ? (back ? "ta" : "te") : (back ? "da" : "de");
  return `${clean}'${suffix}`;
}

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
    ...items.slice(0, 6).map((i) => `${i.productName}: ₺${fmtPrice(i.price)}/kg${i.weekChangePct == null ? "" : ` (${signed(i.weekChangePct)})`}`),
    "",
    `${dateLabel(date)} · ${items[0]?.markets ?? 0}+ halden ortalama`,
  ].join("\n");
}


function cityCaption(data: CityCompare): string {
  const cheapest = data.rows[0];
  const priciest = data.rows[data.rows.length - 1];
  const head = cheapest && priciest && cheapest.cityName !== priciest.cityName
    ? `${data.productName} ${locative(cheapest.cityName)} ₺${fmtPrice(cheapest.price)}, ${locative(priciest.cityName)} ₺${fmtPrice(priciest.price)}.`
    : `${data.productName} şehir şehir hal fiyatları.`;
  return [
    head,
    `Kendi şehrini karşılaştır → ${SITE}/fiyatlar`,
    "",
    ...data.rows.map((row) => `${row.cityName}: ₺${fmtPrice(row.price)}/kg${row.diffPct == null ? "" : ` (${signed(row.diffPct)})`}`),
    "",
    `Ülke medyanı ₺${fmtPrice(data.national)}/kg · ${dateLabel(data.date)}`,
  ].join("\n");
}


function gapCaption(items: GapRow[], date: string, retailDate: string): string {
  const lead = items[0];
  const head = lead
    ? `${lead.productName} halde ₺${fmtPrice(lead.halPrice)}, ${lead.retailChain} rafında ₺${fmtPrice(lead.retailPrice)}.`
    : "Hal fiyatı ile market rafı arasındaki fark.";
  return [
    head,
    `Bugünün hal fiyatları → ${SITE}/fiyatlar`,
    "",
    ...items.slice(0, 6).map((i) => `${i.productName}: hal ₺${fmtPrice(i.halPrice)} → ${i.retailChain} ₺${fmtPrice(i.retailPrice)} (+%${fmtPct(i.gapPct)})`),
    "",
    `Hal ${dateLabel(date)}, market ${dateLabel(retailDate)}. Market fiyatı, o üründe bulunan zincirler arasındaki en düşük raf fiyatıdır; hal fiyatı toptan seviyedir.`,
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
  if (series === "k3") {
    const data = await selectCityCompare(8);
    if (!data) return null;
    const png = await renderCityCard(data, size, dateLabel(data.date));
    const imageUrl = await uploadCard(png, `k3-${data.productSlug}-${data.date}-${size}`);
    return {
      series, size, imageUrl, caption: cityCaption(data),
      hashtags: `${HASHTAGS} #ŞehirŞehirHal`, link: `${SITE}/urun/${data.productSlug}`,
      contentKey: `k3:${data.productSlug}:${data.date}`, recordedDate: data.date, itemCount: data.rows.length,
    };
  }

  if (series === "k4") {
    const { items, date, retailDate } = await selectHalToMarket(8);
    if (items.length < 3) return null;
    const png = await renderGapCard(items, size, dateLabel(date));
    const imageUrl = await uploadCard(png, `k4-${date}-${size}`);
    return {
      series, size, imageUrl, caption: gapCaption(items, date, retailDate),
      hashtags: `${HASHTAGS} #HaldenMarkete`, link: `${SITE}/fiyatlar`,
      contentKey: `k4:${date}`, recordedDate: date, itemCount: items.length,
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

export { selectBasket, selectCityCompare, selectHalToMarket, selectMovers } from "./select";
export type { CardSize } from "./render";
