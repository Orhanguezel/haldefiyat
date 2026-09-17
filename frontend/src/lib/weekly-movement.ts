export type MovementRow = {
  recordedDate: string;
  avgPrice: string | number | null;
  cityName?: string | null;
  marketSlug?: string | null;
  /** Aile icindeki hangi urun kaydi — cesit degisimini yakalamak icin sart. */
  productSlug?: string | null;
  unit?: string | null;
};

export type WeeklyMovement = {
  /** Son 7 gun: kararli hallerin hafta ortancalarinin ortalamasi. */
  current: number;
  /** Onceki 7 gun: ayni hallerin ayni yontemle hesaplanmis seviyesi. */
  previous: number;
  changePct: number;
  unit: string;
  /** Kiyasa GERCEKTEN giren hal sayisi: iki pencerede de kaydi olan ve kendi icinde kararli olanlar. */
  marketCount: number;
  /**
   * Hareketin YAYGINLIGI: kac halde yukseldi, kac halde geriledi.
   *
   * Burada bilerek "en cok artan sehir" YOK. Uc-deger secimi (max/min) 18 serinin
   * en oynagini bulmak icin tasarlanmis bir istatistiktir ve uc ayri turda uc ayri
   * artefakt uretti: bozuk seri (Eskisehir patates 7,00/36,00), cesit degisimi
   * (K.Maras domates-bursa → domates) ve artik kategori (elma-diger, min 13 max
   * 120 TL). Her turda suzgec ekledim, her turda baska bir kaynaktan geri geldi —
   * cunku sorun suzgecte degil, "en ucta olani sec" kurgusunda. Sayim ise
   * dayaniklidir: tek bir bozuk seri 18'de bir oy kadar agirlik tasir.
   */
  risingMarkets: number;
  fallingMarkets: number;
};

const DAY = 86400000;

/**
 * Bir halin KENDI icinde bir hafta boyunca en yuksek/en dusuk fiyat orani.
 * Bunun ustundeki seri fiyat seviyesi degil gurultudur ve haftalik kiyasa
 * girerse hem ortalamayi hem "en cok artan sehir" secimini bozar.
 */
const MAX_INTRA_WINDOW_RATIO = 2;

function mean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** Tek gunluk sicrama haftalik seviyeyi belirlemesin. */
function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 === 1 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

function isStable(values: number[]): boolean {
  const min = Math.min(...values);
  const max = Math.max(...values);
  return min > 0 && max / min <= MAX_INTRA_WINDOW_RATIO;
}

/**
 * Haftalik hareket — "neden arttı / ne bekleniyor" sorularının ilk yarısı.
 *
 * 17 Eyl 2026 AI gorunurluk olcumu: yanitlar bu soru kalibinda YORUM iceriği
 * aliyor; bizde gunun rakami ve sehir kirilimi vardi ama "gecen haftaya gore ne
 * oldu" hicbir urun sayfasinda yazmiyordu.
 *
 * UC SUZGEC — ucu de ayni hatanin farkli katmani: "iki sayiyi kiyasliyorum" sanip
 * aslinda iki FARKLI seyi kiyaslamak.
 *
 * 1. ESLESMIS HAL: iki pencerenin ortalamasi yalnizca HER IKISINDE DE kaydi olan
 *    hallerden hesaplanir. Yoksa bir halin o hafta yayin yapmamasi, fiyat
 *    degismemisken degismis gibi gorunur (yillik kiyastaki uzum -%31,6 artefakti).
 *
 * 2. KARARLI SERI: bir hal kendi icinde bir hafta boyunca 7,00 ve 36,00 TL/kg
 *    yaziyorsa (Eskisehir patates, 17 Eyl) o seri fiyat seviyesi degil gurultudur.
 *    Ortalamada 18 halin icinde erir ama "en cok artan sehir" tam da EN UC hali
 *    sectigi icin sistematik olarak EN BOZUK kaynagi one cikarir. Bu yuzden
 *    kararsiz hal hem sehir kiyasindan hem ortalamadan cikarilir; marketCount da
 *    gercekten kullanilan hal sayisini gosterir.
 *
 * 3. ESLESMIS URUN: seri anahtari hal DEGIL hal+urun kaydidir. Urun sayfasi aile
 *    satirlarini birlestirdigi icin bir hal gecen hafta `domates-bursa`, bu hafta
 *    `domates` yayinladiginda hal esleser ama urun eslesmezdi (Kahramanmaras,
 *    17 Eyl: 13,00 → 25,00 = "%92,3 artis"). Bu yuzden cagiran taraf satirlari
 *    `bucket=daily` ile almali — kovalanmis sorgu cesitleri bilerek birlestirir
 *    ve productSlug'i bos birakir, o zaman bu suzgec calismaz.
 */
export function computeWeeklyMovement(rows: MovementRow[], now = new Date()): WeeklyMovement | null {
  const valid = rows.filter((r) => Number(r.avgPrice) > 0 && r.recordedDate && r.marketSlug);
  if (valid.length === 0) return null;

  const end = valid.reduce((max, r) => (r.recordedDate > max ? r.recordedDate : max), valid[0]!.recordedDate);
  const endMs = Date.parse(end);
  if (!Number.isFinite(endMs) || now.getTime() - endMs > 14 * DAY) return null;

  const inWindow = (r: MovementRow, fromDays: number, toDays: number) => {
    const t = Date.parse(r.recordedDate);
    return t <= endMs - fromDays * DAY && t > endMs - toDays * DAY;
  };

  // Seri anahtari HAL DEGIL hal+urun: ayni hal iki haftada iki farkli cesit
  // yayinlayabiliyor ve bu, fiyat degismemisken degismis gibi gorunuyor.
  const seriesKey = (r: MovementRow) => `${r.marketSlug}\u0000${r.productSlug ?? ""}`;

  const bySeries = (window: MovementRow[]) => {
    const map = new Map<string, number[]>();
    for (const r of window) {
      const key = seriesKey(r);
      map.set(key, [...(map.get(key) ?? []), Number(r.avgPrice)]);
    }
    return map;
  };

  const cur = bySeries(valid.filter((r) => inWindow(r, -1, 7)));
  const prev = bySeries(valid.filter((r) => inWindow(r, 7, 14)));
  const shared = [...cur.keys()].filter(
    (k) => prev.has(k) && isStable(cur.get(k)!) && isStable(prev.get(k)!),
  );
  if (shared.length === 0) return null;

  const current = mean(shared.map((k) => median(cur.get(k)!)));
  const previous = mean(shared.map((k) => median(prev.get(k)!)));
  if (!(previous > 0) || !(current > 0)) return null;

  // Seri degisimleri HAL bazinda toplanir: bir hal iki cesit yayinliyorsa tek oy.
  const perMarket = new Map<string, number[]>();
  for (const k of shared) {
    const marketSlug = k.split("\u0000")[0]!;
    const change = ((median(cur.get(k)!) - median(prev.get(k)!)) / median(prev.get(k)!)) * 100;
    perMarket.set(marketSlug, [...(perMarket.get(marketSlug) ?? []), change]);
  }
  const marketChanges = [...perMarket.values()].map(mean);

  return {
    current,
    previous,
    changePct: ((current - previous) / previous) * 100,
    unit: valid.find((r) => r.unit)?.unit ?? "kg",
    marketCount: marketChanges.length,
    risingMarkets: marketChanges.filter((c) => c > 0.5).length,
    fallingMarkets: marketChanges.filter((c) => c < -0.5).length,
  };
}

const tr = (n: number) => n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = (n: number) => `%${Math.abs(n).toLocaleString("tr-TR", { maximumFractionDigits: 1 })}`;

/** Tek cumle: sabit iddia yok, hepsi olculen sayidan turer. */
export function describeWeeklyMovement(productName: string, m: WeeklyMovement): string {
  const dir = m.changePct > 0.5 ? "yükseldi" : m.changePct < -0.5 ? "geriledi" : "yatay seyretti";
  const head = Math.abs(m.changePct) <= 0.5
    ? `${productName} son haftada ${tr(m.current)} TL/${m.unit} ile yatay seyretti`
    : `${productName} son haftada ${pct(m.changePct)} ${dir}: ${tr(m.previous)} → ${tr(m.current)} TL/${m.unit}`;
  const base = `${m.marketCount} halin her iki haftada da yayımladığı kayıtlar üzerinden`;
  // Yon tek bir halden degil, hallerin cogunlugundan okunur.
  const yayginlik = [
    m.fallingMarkets > 0 ? `${m.fallingMarkets} halde geriledi` : null,
    m.risingMarkets > 0 ? `${m.risingMarkets} halde yükseldi` : null,
  ].filter(Boolean).join(", ");
  return `${head}; ${base}${yayginlik ? `. Hallerin dağılımı: ${yayginlik}` : ""}.`;
}
