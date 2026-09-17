type ProductLabelRow = { nameTr: string; displayName: string | null; unit: string };

const UNIT_LABELS: Record<string, string> = {
  kg: "Kg", kilogram: "Kg", kilo: "Kg",
  adet: "Adet", tane: "Adet",
  bag: "Bağ", "bağ": "Bağ", demet: "Demet",
  kasa: "Kasa", koli: "Koli", sandik: "Sandık", "sandık": "Sandık",
  paket: "Paket", cuval: "Çuval", "çuval": "Çuval",
  lt: "Litre", litre: "Litre",
};

/**
 * Etiketin gruplama birimi, ETL'in `unitClass` sinifiyla AYNI kararlari vermeli;
 * yoksa veri katmani iki kaydi ayni urun sayarken gorunen katman onlari farkli
 * birimde sanip ikisini birden etiketler.
 *
 * Fiilen yasanan: `roka` (demet) ile `roka-bag` (bağ) ETL icin ayni birimdir
 * (normalizer.ts UNIT_CLASS: "bağ = demet, ikisi de bunch") ama burasi bilmiyordu
 * ve arama hacmi olan `roka` sayfasinin H1'i "Roka (Demet)" oluyordu.
 *
 * unitClass'i dogrudan cagirmiyoruz: o, TANIMADIGI birimi uyarip "kg" varsayar
 * (ETL icin dogru — bilinmeyen birim fiyati bozmasin). Etiket icin bu yanlis
 * olur, "sandık" birimi "(Kg)" diye yazilirdi. Bu yuzden esleme burada duruyor;
 * ortak kararlar unit-class-hizasi testiyle sabitlendi.
 */
function normalizedUnit(unit: string) {
  const key = unit.trim().toLocaleLowerCase("tr-TR");
  if (["kg", "kilogram", "kilo", "kg."].includes(key)) return "kg";
  if (["adet", "tane", "ad"].includes(key)) return "adet";
  if (["bağ", "bag", "demet"].includes(key)) return "demet";
  return key;
}

/**
 * Cakisma anahtari = KULLANICININ GORDUGU ad.
 *
 * Bu fonksiyon eskiden addan birim kelimelerini de siliyordu ("Limon Sandık" →
 * "limon"), boylece paketleme varyanti ana urunle ayni temele dusuyor ve IKISI
 * BIRDEN etiketleniyordu: aramada yilda 122 bin kez yazilan `limon` sayfasi
 * H1'inde, SSS'sinde ve JSON-LD'sinde "Limon (Kg)" oluyordu — oysa ortada
 * belirsizlik yoktu, "Limon" ile "Limon Sandık" zaten farkli okunuyor.
 *
 * Etiketin tek isi ayni gorunen iki satiri ayirmak. Gorunen adlar zaten
 * farkliysa eklenecek bir sey yok. 17 Eyl 2026 olcumu: eski kural 39 urune
 * etiket takiyordu, 28'i gereksizdi ve 15'i indexli ana urun sayfasiydi
 * (limon, kiraz, ispanak, mantar, muz ithal, palamut, nane, pazi…).
 */
function labelBase(row: ProductLabelRow) {
  return (row.displayName || row.nameTr)
    .toLocaleLowerCase("tr-TR")
    .replace(/[^a-z0-9çğıöşü]+/gu, " ")
    .trim();
}

export function disambiguateProductUnitLabels<T extends ProductLabelRow>(rows: T[]): T[] {
  const unitsByBase = new Map<string, Set<string>>();
  for (const row of rows) {
    const base = labelBase(row);
    if (!base) continue;
    const units = unitsByBase.get(base) ?? new Set<string>();
    units.add(normalizedUnit(row.unit));
    unitsByBase.set(base, units);
  }
  return rows.map((row) => {
    const base = labelBase(row);
    if ((unitsByBase.get(base)?.size ?? 0) < 2) return row;
    const unit = normalizedUnit(row.unit);
    const label = UNIT_LABELS[unit] ?? row.unit.trim();
    const current = (row.displayName || row.nameTr).trim();
    if (!label || new RegExp(`(?:\\(|\\b)${label}(?:\\)|\\b)`, "iu").test(current)) return row;
    return { ...row, displayName: `${current} (${label})` };
  });
}
