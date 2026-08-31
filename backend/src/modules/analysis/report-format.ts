// Haftalik rapor metin bicimlendirmesi — saf fonksiyonlar (DB/IO yok), test edilebilir.
// Amac: uretilen taslagin yayinlanan raporlarla ayni dilde/bicimde cikmasi.
// tr-TR: ondalik ayraci virgul, binlik ayraci nokta, para birimi ₺.

const NF = new Map<number, Intl.NumberFormat>();

function nf(decimals: number): Intl.NumberFormat {
  let f = NF.get(decimals);
  if (!f) {
    f = new Intl.NumberFormat("tr-TR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    NF.set(decimals, f);
  }
  return f;
}

export function trNum(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return "—";
  return nf(decimals).format(value);
}

/** Isaretsiz yuzde: "%20,0". Yon metinle/ikonla ayrica verilir. */
export function trPct(value: number, decimals = 1): string {
  if (!Number.isFinite(value)) return "—";
  return `%${nf(decimals).format(Math.abs(value))}`;
}

/** Isaretli yuzde: "−%2,8" / "+%7,6" (tablo hucreleri icin). */
export function trPctSigned(value: number, decimals = 1): string {
  if (!Number.isFinite(value)) return "—";
  if (value === 0) return `%${nf(decimals).format(0)}`;
  return `${value < 0 ? "−" : "+"}%${nf(decimals).format(Math.abs(value))}`;
}

export function trPrice(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return `${nf(2).format(value)} ₺`;
}

export function trPriceUnit(value: number, unit = "TL/kg"): string {
  if (!Number.isFinite(value)) return "—";
  return `${nf(2).format(value)} ${unit}`;
}

const MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

function parts(iso: string): { d: number; m: number; y: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso ?? ""));
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  return { d, m, y };
}

/** "10 – 16 Ağustos 2026" · ay/yil degisirse "27 Temmuz – 2 Ağustos 2026". */
export function trPeriod(weekStart: string, weekEnd: string): string {
  const a = parts(weekStart);
  const b = parts(weekEnd);
  if (!a || !b) return "";
  if (a.y !== b.y) return `${a.d} ${MONTHS[a.m - 1]} ${a.y} – ${b.d} ${MONTHS[b.m - 1]} ${b.y}`;
  if (a.m !== b.m) return `${a.d} ${MONTHS[a.m - 1]} – ${b.d} ${MONTHS[b.m - 1]} ${b.y}`;
  return `${a.d} – ${b.d} ${MONTHS[a.m - 1]} ${a.y}`;
}

/** Tablo hucresi icin kisa donem: "10–16 Ağu". */
export function trPeriodShort(weekStart: string, weekEnd: string): string {
  const a = parts(weekStart);
  const b = parts(weekEnd);
  if (!a || !b) return "";
  const short = (m: number) => MONTHS[m - 1]!.slice(0, 3);
  if (a.m !== b.m) return `${a.d} ${short(a.m)}–${b.d} ${short(b.m)}`;
  return `${a.d}–${b.d} ${short(a.m)}`;
}

export type IndexPoint = { indexWeek: string; indexValue: number; basketAvg: number; weekStart: string; weekEnd: string };

export type IndexStatus = {
  value: number;
  previous: number | null;
  changePct: number | null;
  isNewLow: boolean;
  /** Baslikta kullanilan kisa etiket. Sayiya ek cekimi getirmez (74,3'e/74,3'ye tuzagi). */
  label: string;
  /** Dek/paragraf icin uzun anlatim. */
  sentence: string;
};

const FLAT_BAND_PCT = 1;

export function indexStatusOf(history: IndexPoint[], isoWeek: string): IndexStatus | null {
  const idx = history.findIndex((row) => row.indexWeek === isoWeek);
  if (idx < 0) return null;
  const current = history[idx]!;
  const previous = idx > 0 ? history[idx - 1]! : null;
  const value = current.indexValue;
  if (!Number.isFinite(value)) return null;

  const changePct = previous && previous.indexValue > 0
    ? Math.round(((value - previous.indexValue) / previous.indexValue) * 10000) / 100
    : null;

  const earlier = history.slice(0, idx).map((row) => row.indexValue).filter((v) => Number.isFinite(v));
  const isNewLow = earlier.length >= 3 && value < Math.min(...earlier);

  const short = trNum(value, 1);
  let label: string;
  let sentence: string;
  // Yataylasma kontrolu yeni-dip'ten ONCE gelir: -%0,2'lik bir hareket teknik olarak
  // yeni dip olsa da "yeni dipte" demek abartidir; dogru okuma dusus serisinin durmasidir.
  if (changePct != null && Math.abs(changePct) < FLAT_BAND_PCT) {
    label = `Endeks ${short} ile Yataylaştı`;
    sentence = isNewLow
      ? `HaldeFiyat Endeksi ${trPctSigned(changePct)} ile ${trNum(value, 2)} puanda yataylaşarak düşüş serisini durdurdu`
      : `HaldeFiyat Endeksi ${trPctSigned(changePct)} ile ${trNum(value, 2)} puanda yataylaştı`;
  } else if (isNewLow) {
    label = `Endeks ${short} ile Yeni Dipte`;
    sentence = `HaldeFiyat Endeksi ${trNum(value, 2)} puanla serinin yeni dibine indi`;
  } else if (changePct == null) {
    label = `Endeks ${short} Puanda`;
    sentence = `HaldeFiyat Endeksi haftayı ${trNum(value, 2)} puanda tamamladı`;
  } else if (changePct < 0) {
    label = `Endeks ${short} ile Geriledi`;
    sentence = `HaldeFiyat Endeksi ${trPct(changePct)} düşüşle ${trNum(value, 2)} puana indi`;
  } else {
    label = `Endeks ${short} ile Yükseldi`;
    sentence = `HaldeFiyat Endeksi ${trPct(changePct)} artışla ${trNum(value, 2)} puana çıktı`;
  }
  return { value, previous: previous?.indexValue ?? null, changePct, isNewLow, label, sentence };
}

export type TitleMover = { productName: string; changePct: number };

/**
 * Baslik icin ust sinir. Iki gerekcesi var: SERP basligi ~60 karakterden sonra
 * kirpiliyor, ve noktali virgullu uzun baslik listede/kartta iki satira tasip
 * okunmuyor. Sinir asilinca baslik KIRPILMAZ — daha kisa bir aday secilir.
 */
const TITLE_MAX = 60;

/**
 * Baslik: "{Ay} {N}. Hafta Hal Raporu: {tek kanca}".
 *
 * Kanca TEK parcadir. Eskiden endeks durumu ve en guclu hareket noktali virgulle
 * birlestiriliyordu; cikan baslik 80+ karaktere ulasiyor, SERP'te kirpiliyor ve
 * kartlarda iki satira tasiyordu. Iki parca TITLE_MAX'e pratikte hicbir hafta
 * sigmiyor (yalniz "{donem} Hal Raporu: {endeks etiketi}" zaten ~55 karakter),
 * bu yuzden birlesik bicim hic denenmiyor.
 *
 * Endeks parcasi hareketten once gelir: sabit sepet genis tabanli, haftanin en
 * sert hareketi ise cogu zaman az sayida halde olusuyor (rapor govdesinde zaten
 * "dar taban" uyarisi basiliyor) — H1'de one cikan sayinin genis tabanli olani
 * olmasi dogru. Basliga girmeyen hareket kaybolmuyor: dek, ozet, etiketler ve
 * meta aciklama onu tasiyor.
 */
export function buildReportTitle(periodLabel: string, status: IndexStatus | null, mover: TitleMover | null): string {
  const prefix = `${periodLabel} Hal Raporu`;
  const moverPart = mover
    ? `${mover.productName} ${trPct(mover.changePct)} ${mover.changePct < 0 ? "Geriledi" : "Yükseldi"}`
    : null;
  const candidates = [
    status?.label ? `${prefix}: ${status.label}` : null,
    moverPart ? `${prefix}: ${moverPart}` : null,
    prefix,
  ].filter((value): value is string => Boolean(value));
  return candidates.find((value) => value.length <= TITLE_MAX) ?? candidates[candidates.length - 1]!;
}

const META_TITLE_MAX = 60;

/**
 * Meta title 60 karakteri asmasin ama ASLA kelime ortasinda uc nokta ile kesilmesin:
 * once tam baslik, sonra yalniz endeks parcasi, en son donem+yil fallback'i denenir.
 */
export function buildMetaTitleFor(periodLabel: string, status: IndexStatus | null, year: number, fullTitle: string): string {
  const candidates = [
    fullTitle,
    status ? `${periodLabel} Hal Raporu: ${status.label}` : null,
    `${periodLabel} Hal Raporu ${year}`,
    `${periodLabel} Hal Raporu`,
  ].filter((value): value is string => Boolean(value));
  for (const candidate of candidates) {
    if (candidate.length <= META_TITLE_MAX) return candidate;
  }
  return candidates[candidates.length - 1]!;
}

const META_DESC_MAX = 155;

/** Aciklama: kesmek yerine cumle siniri arar; hicbiri sigmazsa son care kirpar. */
export function buildMetaDescriptionFrom(summary: string): string {
  const clean = String(summary ?? "").replace(/\s+/g, " ").trim();
  if (clean.length <= META_DESC_MAX) return clean;
  const sentences = clean.split(/(?<=[.!?])\s+/);
  let out = "";
  for (const sentence of sentences) {
    const next = out ? `${out} ${sentence}` : sentence;
    if (next.length > META_DESC_MAX) break;
    out = next;
  }
  if (out) return out;
  const sliced = clean.slice(0, META_DESC_MAX - 1);
  const lastSpace = sliced.lastIndexOf(" ");
  return `${(lastSpace > 60 ? sliced.slice(0, lastSpace) : sliced).trimEnd()}…`;
}

/** Turkce'de i ile baslayan kelimeler noktali i tasir; ALL-CAPS kaynagin hatali
 *  kucultulmesi "İncir"->"Incır" uretir. Ispanak/Isırgan gercekten dotless: onlar haric. */
const DOTLESS_I_WORDS = ["ıspanak", "ısırgan", "ıstakoz", "ızgara", "ışık", "ıhlamur", "ısı"];

export function looksLikeCasefoldArtifact(displayName: string | null | undefined): boolean {
  const value = String(displayName ?? "").trim();
  if (!value) return false;
  const first = value.slice(0, 1);
  const rest = value.slice(1);
  const lower = value.toLocaleLowerCase("tr-TR");
  if (DOTLESS_I_WORDS.some((word) => lower.startsWith(word))) return false;
  if (first === "I" && /^[a-zçğıöşü]/.test(rest)) return true;
  return /[a-zçğöşü]ı[a-zçğöşü]*$/.test(value) && /I/.test(first);
}
