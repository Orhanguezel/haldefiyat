export type MovementRow = {
  recordedDate: string;
  avgPrice: string | number | null;
  cityName?: string | null;
  marketSlug?: string | null;
  unit?: string | null;
};

export type WeeklyMovement = {
  /** Son 7 gunun hal ortalamasi. */
  current: number;
  /** Onceki 7 gunun hal ortalamasi. */
  previous: number;
  changePct: number;
  unit: string;
  /** Her iki pencerede de kaydi olan hal sayisi — kiyasin dayandigi taban. */
  marketCount: number;
  /** En cok artan ve en cok gerileyen sehir; yalnizca iki pencerede de kaydi olanlar. */
  topRise: { cityName: string; changePct: number } | null;
  topFall: { cityName: string; changePct: number } | null;
};

const DAY = 86400000;

function mean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Haftalik hareket — "neden arttı / ne bekleniyor" sorularının ilk yarısı.
 *
 * 17 Eyl 2026 AI gorunurluk olcumu: yanitlar bu soru kalibinda YORUM iceriği
 * aliyor; bizde gunun rakami ve sehir kirilimi vardi ama "gecen haftaya gore ne
 * oldu" hicbir urun sayfasinda yazmiyordu.
 *
 * ESLESMIS HAL KURALI: iki pencerenin ortalamasi yalnizca HER IKISINDE DE kaydi
 * olan hallerden hesaplanir. Yoksa bir halin o hafta yayin yapmamasi, fiyat
 * degismemisken degismis gibi gorunur — bu hata daha once yillik kiyasta
 * yasanmisti (uzum -%31,6 artefakti).
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

  const byMarket = (window: MovementRow[]) => {
    const map = new Map<string, number[]>();
    for (const r of window) {
      const key = String(r.marketSlug);
      map.set(key, [...(map.get(key) ?? []), Number(r.avgPrice)]);
    }
    return map;
  };

  const cur = byMarket(valid.filter((r) => inWindow(r, -1, 7)));
  const prev = byMarket(valid.filter((r) => inWindow(r, 7, 14)));
  const shared = [...cur.keys()].filter((k) => prev.has(k));
  if (shared.length === 0) return null;

  const current = mean(shared.map((k) => mean(cur.get(k)!)));
  const previous = mean(shared.map((k) => mean(prev.get(k)!)));
  if (!(previous > 0) || !(current > 0)) return null;

  const cityOf = new Map<string, string>();
  for (const r of valid) if (r.marketSlug && r.cityName) cityOf.set(String(r.marketSlug), r.cityName);

  const perCity = shared
    .map((k) => ({
      cityName: cityOf.get(k) ?? k,
      changePct: ((mean(cur.get(k)!) - mean(prev.get(k)!)) / mean(prev.get(k)!)) * 100,
    }))
    .sort((a, b) => b.changePct - a.changePct);

  return {
    current,
    previous,
    changePct: ((current - previous) / previous) * 100,
    unit: valid.find((r) => r.unit)?.unit ?? "kg",
    marketCount: shared.length,
    topRise: perCity[0] && perCity[0].changePct > 0.5 ? perCity[0] : null,
    topFall: perCity.at(-1) && perCity.at(-1)!.changePct < -0.5 ? perCity.at(-1)! : null,
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
  const moves = [
    m.topRise ? `en çok artan ${m.topRise.cityName} (${pct(m.topRise.changePct)})` : null,
    m.topFall ? `en çok gerileyen ${m.topFall.cityName} (${pct(m.topFall.changePct)})` : null,
  ].filter(Boolean).join(", ");
  return `${head}; ${base}${moves ? `. Şehir bazında ${moves}` : ""}.`;
}
