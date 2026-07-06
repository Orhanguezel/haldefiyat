// GSC ham (İngilizce) verdict/coverage değerlerini ekranda Türkçeleştirir.
// Hem ürün (product-gsc-panel) hem analiz (analysis-report-quality-panel) panelinde kullanılır.

const GSC_VERDICT_TR: Record<string, string> = {
  PASS: "Geçti",
  NEUTRAL: "Nötr",
  FAIL: "Başarısız",
  PARTIAL: "Kısmi",
  VERDICT_UNSPECIFIED: "Belirsiz",
};

const GSC_COVERAGE_TR: Array<[RegExp, string]> = [
  [/submitted and indexed/i, "Gönderildi ve indexlendi"],
  [/indexed, not submitted in sitemap/i, "Indexli (sitemap’te değil)"],
  [/discovered - currently not indexed/i, "Keşfedildi – henüz indexlenmedi"],
  [/crawled - currently not indexed/i, "Tarandı – henüz indexlenmedi"],
  [/url is unknown to google/i, "Google bu URL’yi henüz bilmiyor"],
  [/page with redirect/i, "Yönlendirmeli sayfa (301/302)"],
  [/excluded by .?noindex.? tag/i, "noindex etiketiyle hariç tutuldu"],
  [/blocked by robots\.txt/i, "robots.txt ile engellendi"],
  [/duplicate.*different canonical/i, "Kopya – Google farklı canonical seçti"],
  [/duplicate without user-selected canonical/i, "Kopya – canonical seçilmemiş"],
  [/duplicate, submitted url not selected as canonical/i, "Kopya – gönderilen URL canonical seçilmedi"],
  [/alternate page with proper canonical/i, "Canonical’ı doğru alternatif sayfa"],
  [/soft 404/i, "Yumuşak 404"],
  [/not found \(404\)/i, "Bulunamadı (404)"],
  [/server error/i, "Sunucu hatası (5xx)"],
  [/redirect error/i, "Yönlendirme hatası"],
];

export function trGscVerdict(v: string | null): string {
  if (!v) return "—";
  return GSC_VERDICT_TR[v.toUpperCase()] ?? v;
}

export function trGscCoverage(c: string | null): string {
  if (!c) return "—";
  for (const [re, tr] of GSC_COVERAGE_TR) if (re.test(c)) return tr;
  return c;
}
