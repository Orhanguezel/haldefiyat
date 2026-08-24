// Haftalik raporun editoryal HTML iskeleti — saf fonksiyon (DB/IO yok), test edilebilir.
// Yayinlanan raporlarla ayni yapiyi uretir: kicker / dek / meta / h2 + tablolar / notlar.
// Amac: editorun her hafta yapiyi sifirdan kurmasi degil, yorum cumlelerini guclendirmesi.

import type { WeeklySummary } from "@/modules/prices/weekly";
import {
  trNum, trPct, trPctSigned, trPrice, trPriceUnit, trPeriodShort,
  type IndexPoint, type IndexStatus,
} from "./report-format";

export type WatchItem = {
  kind: "product" | "index";
  slug: string | null;
  name: string;
  value: number;
  question: string;
};

export type WatchResult = WatchItem & {
  current: number | null;
  changePct: number | null;
  marketCount: number | null;
};

export type WeeklyReportHtmlInput = {
  periodLabel:   string;
  isoWeek:       string;
  summary:       WeeklySummary;
  status:        IndexStatus | null;
  indexRows:     IndexPoint[];
  basketAvg:     number | null;
  basketSize:    number;
  baseWeekLabel: string | null;
  watchResults:  WatchResult[];
  minMarkets:    number;
};

/** Dar gozlem tabani esigi: bunun altinda ulusal yorum yapilmaz, uyari basilir. */
export const NARROW_BASE_MARKETS = 7;
const DIVERGENCE_PCT = 10;

function esc(value: string): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type Mover = WeeklySummary["topRisers"][number];

function moverRow(m: Mover): string {
  const dir = m.changePct < 0 ? "down" : "up";
  return `<tr><td>${esc(m.productName)}</td><td class="num">${trPrice(m.previousAvg)}</td>`
    + `<td class="num">${trPrice(m.latestAvg)}</td>`
    + `<td class="num ${dir}">${trPctSigned(m.changePct)}</td>`
    + `<td class="num">${m.marketCount}</td></tr>`;
}

function moverTable(rows: Mover[]): string {
  if (!rows.length) return "";
  return `<div class="overflow-x"><table>\n`
    + `<thead><tr><th>Ürün</th><th class="num">Hafta başı</th><th class="num">Hafta sonu</th>`
    + `<th class="num">Değişim</th><th class="num">Hal</th></tr></thead>\n<tbody>\n`
    + rows.map(moverRow).join("\n")
    + `\n</tbody>\n</table></div>`;
}

function indexTable(rows: IndexPoint[]): string {
  if (rows.length < 2) return "";
  const body = rows.map((row, i) => {
    const prev = i > 0 ? rows[i - 1]! : null;
    const pct = prev && prev.indexValue > 0
      ? ((row.indexValue - prev.indexValue) / prev.indexValue) * 100
      : null;
    const last = i === rows.length - 1;
    const wrap = (v: string) => (last ? `<strong>${v}</strong>` : v);
    const label = `${row.indexWeek} (${trPeriodShort(row.weekStart, row.weekEnd)})`;
    const cell = pct == null
      ? "—"
      : `<span class="${pct < 0 ? "down" : "up"}">${wrap(trPctSigned(pct))}</span>`;
    return `<tr><td>${wrap(esc(label))}</td><td class="num">${wrap(trNum(row.indexValue, 2))}</td>`
      + `<td class="num">${wrap(trNum(row.basketAvg, 2))}</td><td class="num">${cell}</td></tr>`;
  }).join("\n");
  return `<div class="overflow-x"><table>\n`
    + `<thead><tr><th>Hafta</th><th class="num">Endeks</th><th class="num">Sepet (TL/kg)</th>`
    + `<th class="num">Haftalık değişim</th></tr></thead>\n<tbody>\n${body}\n</tbody>\n</table></div>`;
}

/** Ayni urun ailesinin iki varyanti zit yonde ve ikisi de esigi asiyorsa isaretle:
 *  "domates ucuzladi" gibi yanlis genellemeyi onler. */
export function findFamilyDivergence(summary: WeeklySummary): { up: Mover; down: Mover } | null {
  const all = [...summary.topRisers, ...summary.topFallers].filter((m) => m.familySlug);
  for (const up of all.filter((m) => m.changePct >= DIVERGENCE_PCT)) {
    const down = all.find((m) => m.familySlug === up.familySlug && m.changePct <= -DIVERGENCE_PCT);
    if (down) return { up, down };
  }
  return null;
}

function headlineSection(summary: WeeklySummary): string {
  const all = [...summary.topFallers, ...summary.topRisers]
    .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct));
  const lead = all[0];
  if (!lead) return "";
  const dir = lead.changePct < 0 ? "gerileme" : "yükseliş";
  const verb = lead.changePct < 0 ? "indi" : "çıktı";
  let html = `<h2>Haftanın Manşeti: ${esc(lead.productName)} ${trPct(lead.changePct)} ${lead.changePct < 0 ? "Geriledi" : "Yükseldi"}</h2>\n`
    + `<p>Haftanın en geniş tabanlı sert hareketi <strong>${esc(lead.productName)}</strong> tarafında görüldü. `
    + `${lead.marketCount} halin medyanı hafta başındaki ${trPriceUnit(lead.previousAvg)} seviyesinden hafta sonunda `
    + `${trPriceUnit(lead.latestAvg)} seviyesine ${verb}; haftalık değişim <strong>${trPctSigned(lead.changePct)}</strong>. `
    + `Bu ${dir} ${lead.marketCount} ayrı halde aynı yönde gözlendiği için tek kaynaklı bir kayıt hatasından çok `
    + `piyasa genelindeki bir hareketi işaret ediyor. Hal kayıtları fiyat hareketini gösterir, tek başına sebebini kanıtlamaz; `
    + `neden-sonuç yorumu üretim ve meteoroloji verisiyle ayrıca doğrulanmalıdır.</p>\n`;

  if (lead.marketCount <= NARROW_BASE_MARKETS) {
    html += `<p class="note"><strong>Dikkat:</strong> ${esc(lead.productName)} yalnızca ${lead.marketCount} hallik dar bir `
      + `gözlem tabanında fiyatlanıyor. Erken sezon veya sınırlı arz dönemlerinde bu tabandaki hareketler haftadan haftaya `
      + `sert biçimde yön değiştirebilir; ülke geneline yayıldığı sonucu çıkarılmamalıdır.</p>\n`;
  }

  const div = findFamilyDivergence(summary);
  if (div) {
    html += `<p>Aynı ürün ailesinde zıt yönlü bir ayrışma var: <strong>${esc(div.up.productName)}</strong> `
      + `${trPctSigned(div.up.changePct)} yükselirken <strong>${esc(div.down.productName)}</strong> `
      + `${trPctSigned(div.down.changePct)} geriledi. Bu nedenle bu hafta için ürün ailesinin tamamını kapsayan `
      + `"ucuzladı" ya da "pahalandı" genellemesi doğru olmaz; çeşit bazlı okuma gerekir.</p>\n`;
  }
  return html;
}

function breadthSection(summary: WeeklySummary): string {
  const b = summary.breadth;
  if (!b || !b.measured) return "";
  const median = b.medianChangePct == null ? null : trPctSigned(b.medianChangePct);
  const tone = b.medianChangePct == null
    ? ""
    : b.medianChangePct < -0.5
      ? " Medyanın eksi tarafta kalması, hareketin birkaç üründe değil geneline yayıldığını gösteriyor."
      : b.medianChangePct > 0.5
        ? " Medyanın artı tarafta kalması, yükselişin birkaç üründe değil geneline yayıldığını gösteriyor."
        : " Medyanın sıfıra yakın kalması, yükselen ve gerileyen ürünlerin birbirini dengelediğini gösteriyor.";
  return `<h2>Piyasa Genişliği</h2>\n`
    + `<p>Ölçüt karşılayan <strong>${b.measured} üründe</strong> haftalık medyan değişim `
    + `<strong>${median ?? "—"}</strong> oldu: ${b.up} ürün yükseldi, ${b.down} ürün geriledi, ${b.flat} ürün yatay kaldı.`
    + `${tone}</p>\n`
    + `<p class="note"><strong>Okuma notu:</strong> Bu bölüm ürünlerin fiyat düzeyini değil, haftalık yönünü özetler. `
    + `Kilogram bazlı olmayan ve fiyat düzeyi kıyaslanamayan kalemler (balık, et, canlı hayvan, hububat, bakliyat) `
    + `hareket ölçümünün dışındadır.</p>\n`;
}

function watchlistSection(results: WatchResult[]): string {
  if (!results.length) return "";
  const items = results.map((r) => {
    if (r.current == null || r.changePct == null) {
      return `<p><strong>${esc(r.name)}:</strong> bu hafta ölçüt karşılayan yeterli gözlem oluşmadığı için `
        + `karşılaştırılabilir bir değer üretilmedi.</p>`;
    }
    const moved = Math.abs(r.changePct) >= 1;
    const dirWord = !moved ? "yatay kaldı" : r.changePct < 0 ? "geriledi" : "yükseldi";
    const unit = r.kind === "index" ? "puan" : "TL/kg";
    const base = r.kind === "index"
      ? `${trNum(r.value, 2)} ${unit} seviyesinden ${trNum(r.current, 2)} ${unit} seviyesine`
      : `${trPriceUnit(r.value)} seviyesinden ${trPriceUnit(r.current)} seviyesine`;
    const halls = r.marketCount ? ` (${r.marketCount} hal)` : "";
    return `<p><strong>${esc(r.name)}:</strong> ${esc(r.question)} — ${base} ${dirWord}; `
      + `haftalık değişim <strong>${trPctSigned(r.changePct)}</strong>${halls}.</p>`;
  }).join("\n");
  return `<h2>Geçen Haftanın Takip Listesi Ne Söyledi?</h2>\n`
    + `<p>Geçen raporda işaretlediğimiz başlıkların bu haftaki durumu:</p>\n${items}\n`;
}

const ORDINALS = ["İlk", "İkinci", "Üçüncü", "Dördüncü"];

function outlookSection(summary: WeeklySummary, status: IndexStatus | null): string {
  const lines: string[] = [];
  // Sira sozcugu maddenin gercek konumundan turetilir: endeks maddesi atlandiginda
  // liste "Ikinci baslik" diye baslamaz.
  const ord = () => ORDINALS[lines.length] ?? "Bir diğer";
  if (status) {
    const q = status.isNewLow
      ? "yeni bir dip mi geleceği yoksa serinin taban mı yapacağı"
      : status.changePct != null && Math.abs(status.changePct) < 1
        ? "yataylaşmanın bir dönüşün ilk adımı mı yoksa düşüşün molası mı olduğu"
        : "hareketin önümüzdeki hafta da sürüp sürmediği";
    lines.push(`<p>${ord()} başlık endeksin yönü: ${q} izlenmeli. `
      + `Sepet ortalamasının bu seviyede tutunması, haftalık hareketin kalıcılığı hakkında ilk sinyali verecek.</p>`);
  }
  const lead = [...summary.topFallers, ...summary.topRisers]
    .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))[0];
  if (lead) {
    lines.push(`<p>${ord()} başlık ${esc(lead.productName)}: ${trPriceUnit(lead.latestAvg)} seviyesi `
      + `${lead.marketCount} hallik tabanda oluştu; bu seviyenin tutup tutmadığı hareketin kalıcı olup olmadığını gösterecek.</p>`);
  }
  const narrow = [...summary.topRisers, ...summary.topFallers].find((m) => m.marketCount <= NARROW_BASE_MARKETS);
  if (narrow) {
    lines.push(`<p>${ord()} başlık ${esc(narrow.productName)}: gözlem tabanının ${narrow.marketCount} halin üzerine çıkıp `
      + `çıkmadığı, buradaki fiyat oluşumunun ülke geneline yayılıp yayılmadığını netleştirecek.</p>`);
  }
  lines.push(`<p>Günlük minimum, ortalama ve maksimum fiyatlar HaldeFiyat fiyat tablosu ile `
    + `ürün detay grafiklerinden takip edilebilir.</p>`);
  return `<h2>Önümüzdeki Hafta Ne İzlenmeli?</h2>\n${lines.join("\n")}\n`;
}

function methodologyNote(input: WeeklyReportHtmlInput): string {
  const base = input.baseWeekLabel ? ` HaldeFiyat Endeksi, ${input.basketSize} temel üründen oluşan sabit sepeti `
    + `${input.baseWeekLabel} baz haftasına göre izler.` : "";
  return `<p class="note"><strong>Metodoloji:</strong> Rapor, ${input.periodLabel} arasında `
    + `${trNum(input.summary.marketCount, 0)} veri kaynağından (toptancı halleri ve ticaret borsaları) derlenen ${trNum(input.summary.totalRecords, 0)} `
    + `fiyat gözlemine dayanır. Aynı ürünün farklı yazımları kanonik ürün ailesinde birleştirilir. `
    + `En az ${input.minMarkets} ayrı halde görülen kilogram bazlı ürünlerde, haftanın ilk iki günü ile son iki günündeki `
    + `her-hal ortalamaları karşılaştırılır; ulusal değer olarak haller arası medyan kullanılır. Bu yöntem tek bir `
    + `kaynaktaki uç kaydın sonucu bozmasını sınırlar.${base} Veriler toptan hal fiyatıdır; perakende fiyatı değildir `
    + `ve tek başına ticari karar için kullanılmamalıdır.</p>`;
}

export function buildWeeklyReportHtml(input: WeeklyReportHtmlInput): string {
  const { summary, status, periodLabel } = input;
  const lead = [...summary.topFallers, ...summary.topRisers]
    .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))[0];
  const second = [...summary.topFallers, ...summary.topRisers]
    .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))[1];

  const dekParts: string[] = [];
  if (status) dekParts.push(`${status.sentence}.`);
  if (lead) {
    dekParts.push(`Haftanın en sert hareketi ${esc(lead.productName)} tarafında: ${lead.marketCount} halin ortalaması `
      + `<strong>${trPctSigned(lead.changePct)}</strong> değişti.`);
  }
  if (second) {
    dekParts.push(`${esc(second.productName)} ${trPctSigned(second.changePct)} ile onu izledi.`);
  }

  const indexParagraph = status
    ? `<p>HaldeFiyat Endeksi haftayı <strong>${trNum(status.value, 2)} puanda</strong> tamamladı.`
      + (status.previous != null ? ` Önceki haftanın ${trNum(status.previous, 2)} puanına göre değişim `
        + `<strong>${status.changePct == null ? "—" : trPctSigned(status.changePct)}</strong>.` : "")
      + (input.basketAvg != null ? ` Sabit ürün sepetinin ortalaması ${trPriceUnit(input.basketAvg)} olarak ölçüldü.` : "")
      + `</p>\n`
    : `<p>Bu hafta için endeks hesaplaması henüz oluşmadı; fiyat hareketleri ürün ve hal bazlı kayıtlar üzerinden yorumlandı.</p>\n`;

  const sections = [
    `<p class="kicker">Haftalık Hal Raporu · ${esc(periodLabel)}</p>`,
    `<p class="dek">${dekParts.join(" ")}</p>`,
    `<div class="meta"><span><strong>Dönem:</strong> ${esc(periodLabel)} (ISO ${esc(input.isoWeek)})</span>`
      + `<span><strong>Kayıt:</strong> ${trNum(summary.totalRecords, 0)} fiyat gözlemi</span>`
      + `<span><strong>Kaynak sayısı:</strong> ${trNum(summary.marketCount, 0)} hal ve borsa</span>`
      + `<span><strong>Kaynak:</strong> Belediye halleri + HKS (Ticaret Bakanlığı)</span></div>`,
    "",
    `<h2>${esc(status?.label ?? "Haftanın Endeks Görünümü")}</h2>`,
    indexParagraph + indexTable(input.indexRows),
    "",
    headlineSection(summary),
    "",
    summary.topFallers.length ? `<h2>Fiyatı Gerileyen Ürünler</h2>\n${moverTable(summary.topFallers)}\n`
      + `<p class="note"><strong>Okuma notu:</strong> “Hal” sütunu, ürünün karşılaştırmanın hem başlangıç hem bitiş `
      + `penceresinde gözlendiği asgari hal sayısını gösterir. Ulusal gösterge her halin ortalamasından türetilen `
      + `medyandır; fiyatlar perakende etiketi değil, toptan hal seviyesidir.</p>` : "",
    "",
    summary.topRisers.length ? `<h2>Fiyatı Yükselen Ürünler</h2>\n${moverTable(summary.topRisers)}` : "",
    "",
    breadthSection(summary),
    "",
    watchlistSection(input.watchResults),
    "",
    outlookSection(summary, status),
    "",
    methodologyNote(input),
  ];

  return sections.filter((part) => part !== null && part !== undefined).join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** Bu haftanin takip listesi — gelecek hafta otomatik degerlendirilmek uzere saklanir. */
export function buildWatchlist(summary: WeeklySummary, status: IndexStatus | null): WatchItem[] {
  const out: WatchItem[] = [];
  if (status) {
    out.push({
      kind: "index", slug: null, name: "HaldeFiyat Endeksi", value: status.value,
      question: status.isNewLow ? "yeni dip mi taban mı" : "yönün sürüp sürmediği",
    });
  }
  const ranked = [...summary.topFallers, ...summary.topRisers]
    .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct));
  for (const m of ranked.slice(0, 2)) {
    out.push({
      kind: "product", slug: m.productSlug, name: m.productName, value: m.latestAvg,
      question: `${trPriceUnit(m.latestAvg)} seviyesinin tutup tutmadığı`,
    });
  }
  const narrow = ranked.find((m) => m.marketCount <= NARROW_BASE_MARKETS && !out.some((o) => o.slug === m.productSlug));
  if (narrow) {
    out.push({
      kind: "product", slug: narrow.productSlug, name: narrow.productName, value: narrow.latestAvg,
      question: `gözlem tabanının ${narrow.marketCount} halin üzerine çıkıp çıkmadığı`,
    });
  }
  return out;
}

/** Gecen haftanin takip listesini bu haftanin verisiyle degerlendirir. */
export function evaluateWatchlist(
  previous: WatchItem[] | null | undefined,
  summary: WeeklySummary,
  status: IndexStatus | null,
): WatchResult[] {
  if (!Array.isArray(previous) || !previous.length) return [];
  return previous.map((item) => {
    if (item.kind === "index") {
      const current = status?.value ?? null;
      const changePct = current != null && item.value > 0
        ? Math.round(((current - item.value) / item.value) * 10000) / 100
        : null;
      return { ...item, current, changePct, marketCount: null };
    }
    const ref = item.slug ? summary.movementBySlug[item.slug] : undefined;
    if (!ref) return { ...item, current: null, changePct: null, marketCount: null };
    const changePct = item.value > 0
      ? Math.round(((ref.latestAvg - item.value) / item.value) * 10000) / 100
      : ref.changePct;
    return { ...item, current: ref.latestAvg, changePct, marketCount: ref.marketCount };
  });
}
