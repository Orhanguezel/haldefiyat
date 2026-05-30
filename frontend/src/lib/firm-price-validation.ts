export const FIRM_PRICE_UNITS = ["kg", "kasa", "adet", "demet", "bağ", "çuval", "kg/kasa"] as const;
export type FirmPriceUnit = typeof FIRM_PRICE_UNITS[number];

export type FirmPriceInput = {
  productSlug?: string | null;
  productName: string;
  unit: FirmPriceUnit;
  minPrice?: string | null;
  avgPrice: string;
  maxPrice?: string | null;
  recordedDate: string;
};

export type PriceValidationResult = {
  ok: boolean;
  errors: string[];
  value: FirmPriceInput;
};

export function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function validateFirmPriceRow(input: Partial<FirmPriceInput>): PriceValidationResult {
  const value: FirmPriceInput = {
    productSlug: trimOrNull(input.productSlug),
    productName: input.productName?.trim() ?? "",
    unit: FIRM_PRICE_UNITS.includes(input.unit as FirmPriceUnit) ? input.unit as FirmPriceUnit : "kg",
    minPrice: trimOrNull(input.minPrice),
    avgPrice: input.avgPrice?.trim() ?? "",
    maxPrice: trimOrNull(input.maxPrice),
    recordedDate: input.recordedDate?.trim() || todayDateString(),
  };
  const errors: string[] = [];
  const min = parseOptionalNumber(value.minPrice);
  const avg = parseOptionalNumber(value.avgPrice);
  const max = parseOptionalNumber(value.maxPrice);
  if (!value.productName) errors.push("Ürün adı zorunlu.");
  if (value.productName.length > 255) errors.push("Ürün adı 255 karakteri geçemez.");
  if ((value.productSlug?.length ?? 0) > 128) errors.push("Katalog slug 128 karakteri geçemez.");
  if (avg == null || avg <= 0) errors.push("Ortalama fiyat 0'dan büyük olmalı.");
  if (min != null && min < 0) errors.push("En düşük fiyat negatif olamaz.");
  if (max != null && max < 0) errors.push("En yüksek fiyat negatif olamaz.");
  if (min != null && avg != null && min > avg) errors.push("En düşük fiyat ortalamadan büyük olamaz.");
  if (max != null && avg != null && max < avg) errors.push("En yüksek fiyat ortalamadan küçük olamaz.");
  if (min != null && max != null && min > max) errors.push("En düşük fiyat en yüksekten büyük olamaz.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value.recordedDate)) errors.push("Tarih YYYY-AA-GG formatında olmalı.");
  if (value.recordedDate > todayDateString()) errors.push("Gelecek tarih girilemez.");
  return { ok: errors.length === 0, errors, value };
}

export function validateFirmPriceRows(rows: Array<Partial<FirmPriceInput>>) {
  const seen = new Set<string>();
  return rows.map((row) => {
    const result = validateFirmPriceRow(row);
    const key = `${result.value.productName.toLocaleLowerCase("tr")}::${result.value.recordedDate}`;
    if (result.value.productName) {
      if (seen.has(key)) {
        result.ok = false;
        result.errors.push("Aynı ürün ve tarih dosyada yineleniyor.");
      }
      seen.add(key);
    }
    return result;
  });
}

function trimOrNull(value?: string | null): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : null;
}

function parseOptionalNumber(value?: string | null): number | null {
  if (!value) return null;
  const normalized = value.replace(",", ".");
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}
