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
  /** Kiyaslanan pencere uzunlugu (gun). 7 = son hafta, 30 = son ay. */
  windowDays: number;
  /** Son pencere: kararli serilerin pencere ortancalarinin ortalamasi. */
  current: number;
  /** Onceki ayni uzunluktaki pencere: AYNI serilerin ayni yontemle seviyesi. */
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
 * Bir serinin KENDI icinde pencere boyunca en yuksek/en dusuk fiyat orani.
 * Bunun ustundeki seri fiyat seviyesi degil gurultudur ve kiyasa girerse hem
 * ortalamayi hem yayginlik sayimini bozar.
 */
const MAX_INTRA_WINDOW_RATIO = 2;

/**
 * Oran esigi tek basina YETMEZ — 30 gunluk pencerede mevsimsel GERCEK hareket
 * 2 kati asiyor ve suzgec onu da eliyordu (olcum asagida).
 *
 * Ayrim buyuklukte degil YONDE: gurultulu seri salinir, gercek hareket tek
 * yonlu gider. Yon tutarliligi = ardisik gun farklarinin baskin yondeki payi.
 */
const MIN_DIRECTIONAL_CONSISTENCY = 0.8;
/** Tek yonluluk az noktayla anlamsiz; 3 noktali seri sansa tam tutarli cikar. */
const MIN_DIRECTIONAL_POINTS = 10;

function mean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** Tek gunluk sicrama haftalik seviyeyi belirlemesin. */
function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 === 1 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

/** Ardisik farklarin baskin yondeki payi: 0,5 = yazi-tura, 1 = tam tek yonlu. */
function directionalConsistency(series: Array<{ t: number; v: number }>): number {
  const sorted = [...series].sort((a, b) => a.t - b.t);
  let up = 0;
  let down = 0;
  for (let i = 1; i < sorted.length; i += 1) {
    const delta = sorted[i]!.v - sorted[i - 1]!.v;
    if (delta > 0) up += 1;
    else if (delta < 0) down += 1;
  }
  const moves = up + down;
  return moves > 0 ? Math.max(up, down) / moves : 0;
}

/**
 * Seri kiyasa girebilir mi?
 *
 * OLCUM (18 Eyl 2026, 9 urun, canli veri, 30 gunluk pencereler):
 *
 *   306 serinin 37'si (%12,1) oran>2 diye eleniyordu. Bu 37'nin YALNIZ 5'i
 *   tek yonluydu (>=0,80); kalan 32'sinin yon tutarliligi 0,54-0,71 arasi,
 *   yani yazi-tura. Elenen gurultunun en uclari bilinen bozuk kaynak:
 *   ulusal-hal-gov-tr elma-gala 8,50-98,56 TL (oran 11,6, yon 0,54),
 *   elma-eksi 10,00-99,95 (oran 10,0, yon 0,59).
 *
 *   Kurtarilanlar ise tartismasiz gercek: konya-hal limon-ikinci 30 noktada
 *   20 -> 60 TL, yon 1,00. Sezon hareketi.
 *
 *   Manset etkisi (A=suzgecsiz, B=yalniz oran, C=oran VEYA yon):
 *     nar      A -32,9%  B -21,3% (7 seri)  C -24,5% (8 seri)
 *     elma     A -22,9%  B -19,7% (19)      C -22,0% (20)
 *     limon    A -23,9%  B -22,5% (10)      C -24,0% (11)
 *     domates  A -12,0%  B  -9,9% (24)      C -12,5% (25)
 *   Yalniz-oran kurali dususu sistematik olarak KUCUK gosteriyordu; nar'da
 *   11,6 puan. Sebebi acik: mevsimi acilan urunde gercek dusus 2 kati asar,
 *   suzgec tam da o serileri atardi.
 *
 * 7 gunluk pencerede davranis pratikte degismez: bir hafta icinde 10 noktali
 * tek yonlu seri nadirdir, oran esigi orada zaten yetiyordu.
 */
function isUsable(series: Array<{ t: number; v: number }>): boolean {
  const values = series.map((point) => point.v);
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (!(min > 0)) return false;
  if (max / min <= MAX_INTRA_WINDOW_RATIO) return true;
  return series.length >= MIN_DIRECTIONAL_POINTS
    && directionalConsistency(series) >= MIN_DIRECTIONAL_CONSISTENCY;
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
export function computeWeeklyMovement(
  rows: MovementRow[],
  now = new Date(),
  windowDays = 7,
): WeeklyMovement | null {
  if (!Number.isInteger(windowDays) || windowDays < 1) return null;
  const valid = rows.filter((r) => Number(r.avgPrice) > 0 && r.recordedDate && r.marketSlug);
  if (valid.length === 0) return null;

  const end = valid.reduce((max, r) => (r.recordedDate > max ? r.recordedDate : max), valid[0]!.recordedDate);
  const endMs = Date.parse(end);
  // Bayat seri kiyaslanmaz. Esik pencereyle olcekleniyor (iki pencere boyu):
  // 7 gunluk kiyasta 14 gun — degisiklik oncesindeki sabit degerle ayni.
  if (!Number.isFinite(endMs) || now.getTime() - endMs > windowDays * 2 * DAY) return null;

  const inWindow = (r: MovementRow, fromDays: number, toDays: number) => {
    const t = Date.parse(r.recordedDate);
    return t <= endMs - fromDays * DAY && t > endMs - toDays * DAY;
  };

  // Seri anahtari HAL DEGIL hal+urun: ayni hal iki haftada iki farkli cesit
  // yayinlayabiliyor ve bu, fiyat degismemisken degismis gibi gorunuyor.
  const seriesKey = (r: MovementRow) => `${r.marketSlug}\u0000${r.productSlug ?? ""}`;

  const bySeries = (window: MovementRow[]) => {
    const map = new Map<string, Array<{ t: number; v: number }>>();
    for (const r of window) {
      const key = seriesKey(r);
      map.set(key, [...(map.get(key) ?? []), { t: Date.parse(r.recordedDate), v: Number(r.avgPrice) }]);
    }
    return map;
  };

  const cur = bySeries(valid.filter((r) => inWindow(r, -1, windowDays)));
  const prev = bySeries(valid.filter((r) => inWindow(r, windowDays, windowDays * 2)));
  const shared = [...cur.keys()].filter(
    (k) => prev.has(k) && isUsable(cur.get(k)!) && isUsable(prev.get(k)!),
  );
  if (shared.length === 0) return null;

  const level = (points: Array<{ t: number; v: number }>) => median(points.map((p) => p.v));
  const current = mean(shared.map((k) => level(cur.get(k)!)));
  const previous = mean(shared.map((k) => level(prev.get(k)!)));
  if (!(previous > 0) || !(current > 0)) return null;

  // Seri degisimleri HAL bazinda toplanir: bir hal iki cesit yayinliyorsa tek oy.
  const perMarket = new Map<string, number[]>();
  for (const k of shared) {
    const marketSlug = k.split("\u0000")[0]!;
    const change = ((level(cur.get(k)!) - level(prev.get(k)!)) / level(prev.get(k)!)) * 100;
    perMarket.set(marketSlug, [...(perMarket.get(marketSlug) ?? []), change]);
  }
  const marketChanges = [...perMarket.values()].map(mean);

  return {
    windowDays,
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

/** "son haftada" / "son 30 gunde" — pencere uzunlugundan turer, elle yazilmaz. */
function windowLabel(windowDays: number): { donem: string; ikiDonem: string } {
  if (windowDays === 7) return { donem: "son haftada", ikiDonem: "her iki haftada da" };
  return { donem: `son ${windowDays} günde`, ikiDonem: `her iki ${windowDays} günlük dönemde de` };
}

/** Tek cumle: sabit iddia yok, hepsi olculen sayidan turer. */
export function describeWeeklyMovement(productName: string, m: WeeklyMovement): string {
  const { donem, ikiDonem } = windowLabel(m.windowDays);
  const dir = m.changePct > 0.5 ? "yükseldi" : m.changePct < -0.5 ? "geriledi" : "yatay seyretti";
  const head = Math.abs(m.changePct) <= 0.5
    ? `${productName} ${donem} ${tr(m.current)} TL/${m.unit} ile yatay seyretti`
    : `${productName} ${donem} ${pct(m.changePct)} ${dir}: ${tr(m.previous)} → ${tr(m.current)} TL/${m.unit}`;
  const base = `${m.marketCount} halin ${ikiDonem} yayımladığı kayıtlar üzerinden`;
  // Yon tek bir halden degil, hallerin cogunlugundan okunur.
  const yayginlik = [
    m.fallingMarkets > 0 ? `${m.fallingMarkets} halde geriledi` : null,
    m.risingMarkets > 0 ? `${m.risingMarkets} halde yükseldi` : null,
  ].filter(Boolean).join(", ");
  return `${head}; ${base}${yayginlik ? `. Hallerin dağılımı: ${yayginlik}` : ""}.`;
}
