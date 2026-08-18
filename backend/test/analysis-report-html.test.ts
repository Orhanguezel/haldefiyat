import { describe, expect, it } from "vitest";
import {
  buildWatchlist, buildWeeklyReportHtml, evaluateWatchlist, findFamilyDivergence,
} from "../src/modules/analysis/report-html";
import { indexStatusOf, type IndexPoint } from "../src/modules/analysis/report-format";
import type { WeeklySummary } from "../src/modules/prices/weekly";

const mover = (over: Partial<WeeklySummary["topRisers"][number]> = {}) => ({
  productSlug: "fasulye",
  productName: "Fasulye",
  marketName: "12 hal ortalaması",
  changePct: -20,
  latestAvg: 50,
  previousAvg: 62.5,
  marketCount: 12,
  categorySlug: "sebze",
  familySlug: null as string | null,
  ...over,
});

const summary = (over: Partial<WeeklySummary> = {}): WeeklySummary => ({
  week: "2026-33",
  weekStart: "2026-08-10",
  weekEnd: "2026-08-16",
  topRisers: [mover({ productSlug: "nar", productName: "Nar", changePct: 17.24, latestAvg: 170, previousAvg: 145, marketCount: 6, categorySlug: "meyve" })],
  topFallers: [mover()],
  avgByCategory: {},
  breadth: { measured: 87, up: 34, down: 48, flat: 5, medianChangePct: -1.2 },
  movementBySlug: {
    fasulye: { changePct: -20, latestAvg: 50, previousAvg: 62.5, marketCount: 12 },
  },
  totalRecords: 8982,
  productCount: 263,
  marketCount: 38,
  ...over,
});

const points: IndexPoint[] = [
  { indexWeek: "2026-31", indexValue: 76.65, basketAvg: 42.62, weekStart: "2026-07-27", weekEnd: "2026-08-02" },
  { indexWeek: "2026-32", indexValue: 74.48, basketAvg: 41.41, weekStart: "2026-08-03", weekEnd: "2026-08-09" },
  { indexWeek: "2026-33", indexValue: 74.32, basketAvg: 41.33, weekStart: "2026-08-10", weekEnd: "2026-08-16" },
];

const html = (over: Partial<WeeklySummary> = {}, watchResults: any[] = []) => buildWeeklyReportHtml({
  periodLabel: "10 – 16 Ağustos 2026",
  isoWeek: "2026-33",
  summary: summary(over),
  status: indexStatusOf(points, "2026-33"),
  indexRows: points,
  basketAvg: 41.33,
  basketSize: 15,
  baseWeekLabel: "11 – 17 Mayıs 2026",
  watchResults,
  minMarkets: 6,
});

describe("buildWeeklyReportHtml", () => {
  it("yayınlanan konseptin iskeletini üretir", () => {
    const out = html();
    expect(out).toContain('<p class="kicker">Haftalık Hal Raporu · 10 – 16 Ağustos 2026</p>');
    expect(out).toContain('<p class="dek">');
    expect(out).toContain('<div class="meta">');
    expect(out).toContain("<h2>Endeks 74,3 ile Yataylaştı</h2>");
    expect(out).toContain("Fiyatı Gerileyen Ürünler");
    expect(out).toContain("Fiyatı Yükselen Ürünler");
    expect(out).toContain("Önümüzdeki Hafta Ne İzlenmeli?");
    expect(out).toContain("<strong>Metodoloji:</strong>");
  });

  it("düz metin stub kalıntısı bırakmaz", () => {
    const out = html();
    expect(out).not.toContain("**");
    expect(out).not.toContain("Invalid Date");
    expect(out).not.toContain("undefined");
    expect(out).not.toContain("NaN");
  });

  it("sayıları ve tarihleri tr-TR biçiminde yazar", () => {
    const out = html();
    expect(out).toContain("74,32");
    expect(out).toContain("−%20,0");
    expect(out).toContain("50,00 ₺");
    expect(out).not.toMatch(/\d{4}-\d{2}-\d{2}/);
  });

  it("metodolojiye gerçek parametreleri koyar", () => {
    const out = html();
    expect(out).toContain("En az 6 ayrı halde");
    expect(out).toContain("15 temel üründen");
    expect(out).toContain("11 – 17 Mayıs 2026 baz haftasına");
    expect(out).toContain("8.982");
  });

  it("kategori ortalaması yerine piyasa genişliği gösterir", () => {
    const out = html();
    expect(out).toContain("Piyasa Genişliği");
    expect(out).toContain("87 üründe");
    expect(out).toContain("34 ürün yükseldi");
    expect(out).not.toContain("balik-donuk");
  });

  it("dar tabanlı manşette uyarı basar", () => {
    const out = html({
      topFallers: [],
      topRisers: [mover({ productSlug: "nar", productName: "Nar", changePct: 17.24, latestAvg: 170, previousAvg: 145, marketCount: 6 })],
    });
    expect(out).toContain("yalnızca 6 hallik dar bir");
  });

  it("geniş tabanlı manşette uyarı basmaz", () => {
    expect(html()).not.toContain("dar bir");
  });

  it("ürün adını HTML olarak kaçırır", () => {
    const out = html({ topFallers: [mover({ productName: "<script>x</script>" })] });
    expect(out).not.toContain("<script>");
    expect(out).toContain("&lt;script&gt;");
  });
});

describe("findFamilyDivergence", () => {
  it("aynı ailede zıt yönlü çift haneli hareketi yakalar", () => {
    const s = summary({
      topRisers: [mover({ productSlug: "domates-salkim", productName: "Domates (Salkım)", changePct: 14.21, familySlug: "domates" })],
      topFallers: [mover({ productSlug: "domates-kokteyl", productName: "Domates Kokteyl", changePct: -16.22, familySlug: "domates" })],
    });
    expect(findFamilyDivergence(s)?.up.productName).toBe("Domates (Salkım)");
    expect(buildWeeklyReportHtml({
      periodLabel: "10 – 16 Ağustos 2026", isoWeek: "2026-33", summary: s,
      status: indexStatusOf(points, "2026-33"), indexRows: points, basketAvg: 41.33,
      basketSize: 15, baseWeekLabel: null, watchResults: [], minMarkets: 6,
    })).toContain("genellemesi doğru olmaz");
  });

  it("aile aynı değilse ayrışma bildirmez", () => {
    expect(findFamilyDivergence(summary())).toBeNull();
  });
});

describe("takip listesi süreklilik", () => {
  it("bu haftanın izlenecek maddelerini üretir", () => {
    const list = buildWatchlist(summary(), indexStatusOf(points, "2026-33"));
    expect(list[0]).toMatchObject({ kind: "index", name: "HaldeFiyat Endeksi" });
    expect(list.some((item) => item.slug === "fasulye")).toBe(true);
    expect(list.every((item) => Number.isFinite(item.value))).toBe(true);
  });

  it("geçen haftanın listesini bu haftanın verisiyle değerlendirir", () => {
    const previous = [
      { kind: "index" as const, slug: null, name: "HaldeFiyat Endeksi", value: 74.48, question: "yönün sürüp sürmediği" },
      { kind: "product" as const, slug: "fasulye", name: "Fasulye", value: 62.5, question: "seviyenin tutup tutmadığı" },
      { kind: "product" as const, slug: "yok-olan", name: "Kaybolan Ürün", value: 10, question: "test" },
    ];
    const results = evaluateWatchlist(previous, summary(), indexStatusOf(points, "2026-33"));
    expect(results[0]!.current).toBe(74.32);
    expect(results[1]!.changePct).toBeCloseTo(-20, 1);
    expect(results[2]!.current).toBeNull();
  });

  it("geçen hafta listesi yoksa bölüm üretilmez", () => {
    expect(evaluateWatchlist(null, summary(), null)).toEqual([]);
    expect(html()).not.toContain("Geçen Haftanın Takip Listesi");
  });

  it("değerlendirilmiş liste bölüm olarak basılır", () => {
    const out = html({}, [
      { kind: "product", slug: "fasulye", name: "Fasulye", value: 62.5, question: "seviyenin tutup tutmadığı", current: 50, changePct: -20, marketCount: 12 },
      { kind: "product", slug: "yok", name: "Ölçülemeyen", value: 5, question: "test", current: null, changePct: null, marketCount: null },
    ]);
    expect(out).toContain("Geçen Haftanın Takip Listesi Ne Söyledi?");
    expect(out).toContain("−%20,0");
    expect(out).toContain("yeterli gözlem oluşmadığı");
  });
});

describe("izleme listesi sıralaması", () => {
  it("endeks maddesi varken İlk ile başlar", () => {
    expect(html()).toContain("İlk başlık endeksin yönü");
  });

  it("endeks yoksa numaralandırma yine İlk ile başlar", () => {
    const out = buildWeeklyReportHtml({
      periodLabel: "17 – 23 Ağustos 2026", isoWeek: "2026-34", summary: summary(),
      status: null, indexRows: [], basketAvg: null, basketSize: 15,
      baseWeekLabel: null, watchResults: [], minMarkets: 6,
    });
    expect(out).toContain("İlk başlık");
    expect(out).not.toContain("İkinci başlık Fasulye");
  });
});
