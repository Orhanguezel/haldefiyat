type ProductLabelRow = { nameTr: string; displayName: string | null; unit: string };

const UNIT_LABELS: Record<string, string> = {
  kg: "Kg", kilogram: "Kg", kilo: "Kg",
  adet: "Adet", tane: "Adet",
  bag: "Bağ", "bağ": "Bağ", demet: "Demet",
  kasa: "Kasa", koli: "Koli", sandik: "Sandık", "sandık": "Sandık",
  paket: "Paket", cuval: "Çuval", "çuval": "Çuval",
  lt: "Litre", litre: "Litre",
};

function normalizedUnit(unit: string) {
  const key = unit.trim().toLocaleLowerCase("tr-TR");
  if (["kg", "kilogram", "kilo", "kg."].includes(key)) return "kg";
  if (["adet", "tane"].includes(key)) return "adet";
  return key;
}

function labelBase(row: ProductLabelRow) {
  return (row.displayName || row.nameTr)
    .toLocaleLowerCase("tr-TR")
    .replace(/\((kg|kilogram|kilo|adet|tane|bağ|bag|demet|kasa|koli|sandık|sandik|paket|çuval|cuval|litre|lt)\)/gu, "")
    .replace(/\b(kg|kilogram|kilo|adet|tane|bağ|bag|demet|kasa|koli|sandık|sandik|paket|çuval|cuval|litre|lt)\b/gu, "")
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
