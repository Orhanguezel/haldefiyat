/**
 * Elazig Belediyesi hal fiyatlari.
 *
 * NEDEN: "elazig hal fiyatlari" ailesi ayda ~1.219 gosterim aliyor ve hic
 * kaynagimiz yoktu (2026-09-08 il taramasi). Sayfa duz GET, cerez/oturum/JS
 * istemiyor; veri dogrudan HTML'de.
 *
 * Yapisi:
 *   <ul id="halfiyat"> <li> ... <h4 class="default-title">URUN</h4>
 *       <div class="price text-success">MIN</div>
 *       <div class="price text-danger">MAKS</div>
 *
 * IKI TUZAK:
 * 1. Sayfada HIC TARIH YOK. Adana/Antalya'daki "tarih belgeden gelir" ilkesi
 *    burada uygulanamaz — bu yuzden `priceFingerprint` ile icerik karsilastirmasi
 *    yapilir: sayfa donarsa ayni fiyat kumesi gelir ve gun yeniden yazilmaz.
 * 2. Kaynakta veri hatasi var: "Biber (Kırmızı Kapya)" min 350,00 / maks 75,00
 *    gibi ters satirlar ve ayni sayfada karisik ondalik ayirici ("60.00" ile
 *    "88,00"). Ters satirlar atilir, iki ayirici de kabul edilir.
 */
import { createHash } from "node:crypto";

export interface ElazigRow {
  name: string;
  category: string | null;
  unit: string | null;
  avg: number | null;
  min: number | null;
  max: number | null;
}

const stripTags = (s: string) => s.replace(/<[^>]+>/g, " ");
const decode = (s: string) =>
  s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;|&#160;/g, " ");
const clean = (s: string) => decode(stripTags(s)).replace(/\s+/g, " ").trim();

/**
 * Kaynak ayni sayfada hem "60.00" hem "88,00" yaziyor. Ikisi de ondalik
 * ayirici; binlik ayirici kullanilmiyor (fiyatlar dort haneyi gecmiyor).
 */
function parsePrice(raw: string): number | null {
  const value = Number(raw.trim().replace(",", "."));
  return Number.isFinite(value) ? value : null;
}

export function parseElazigHal(html: string): ElazigRow[] {
  const list = /<ul[^>]*id="halfiyat"[\s\S]*?<\/ul>/i.exec(html);
  if (!list) throw new Error("Elazig: halfiyat listesi bulunamadi");

  const rows: ElazigRow[] = [];
  for (const item of list[0].matchAll(/<li>([\s\S]*?)<\/li>/gi)) {
    const block = item[1]!;
    const name = clean(/<h4[^>]*class="[^"]*default-title[^"]*"[^>]*>([\s\S]*?)<\/h4>/i.exec(block)?.[1] ?? "");
    const prices = [...block.matchAll(/class="price[^"]*"[^>]*>\s*([\d.,]+)/gi)].map((m) => parsePrice(m[1]!));
    if (!name || prices.length < 2) continue;

    const [min, max] = prices;
    if (min == null || max == null) continue;
    // 0 = "kotasyon yok"; sayfada 129 kaydin ~yarisi boyle.
    if (min <= 0 || max <= 0) continue;
    // Kaynak hatasi: min > maks olan satirlar var, uydurma ortalama uretmemek icin atilir.
    if (max < min) continue;

    rows.push({ name, category: null, unit: "kg", avg: null, min, max });
  }

  if (rows.length === 0) throw new Error("Elazig: gecerli fiyat satiri yok");
  return rows;
}

/**
 * Sayfa tarihsiz oldugu icin "yeni bulten mi?" sorusu ancak icerikle yanitlanir.
 * Parmak izi YALNIZ fiyat degerlerinden uretilir: urun adi eslemesine bagimli
 * olmadan, donmus sayfa ayni kumeyi verir. Sirali oldugundan satir sirasi
 * degisse bile ayni sonucu verir.
 */
export function priceFingerprint(rows: Array<{ min: number | null; max: number | null }>): string {
  const pairs = rows
    .filter((r) => r.min != null && r.max != null)
    .map((r) => `${r.min}|${r.max}`)
    .sort();
  return createHash("sha256").update(`${pairs.length}#${pairs.join(",")}`).digest("hex");
}

export async function fetchElazigHal(baseUrl: string, endpoint: string): Promise<ElazigRow[]> {
  const res = await fetch(baseUrl + endpoint, {
    headers: { Accept: "text/html", "User-Agent": "HaldeFiyatBot/1.0 (+https://haldefiyat.com)" },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`Elazig HTTP ${res.status}`);
  return parseElazigHal(await res.text());
}
