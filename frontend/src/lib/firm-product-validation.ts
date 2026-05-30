export type FirmProductInput = {
  productSlug?: string | null;
  productName: string;
  price?: string | null;
  note?: string | null;
  displayOrder?: number;
};

export type ProductValidationResult = {
  ok: boolean;
  errors: string[];
  value: FirmProductInput;
};

export const FIRM_PRODUCT_LIMITS = {
  productSlug: 128,
  productName: 255,
  price: 128,
  note: 500,
};

export function validateProductRow(input: Partial<FirmProductInput>): ProductValidationResult {
  const value: FirmProductInput = {
    productName: input.productName?.trim() ?? "",
    productSlug: trimOrNull(input.productSlug),
    price: trimOrNull(input.price),
    note: trimOrNull(input.note),
    displayOrder: input.displayOrder,
  };
  const errors: string[] = [];
  if (!value.productName) errors.push("Ürün adı zorunlu.");
  if (value.productName.length > FIRM_PRODUCT_LIMITS.productName) errors.push("Ürün adı 255 karakteri geçemez.");
  if ((value.productSlug?.length ?? 0) > FIRM_PRODUCT_LIMITS.productSlug) errors.push("Katalog slug 128 karakteri geçemez.");
  if ((value.price?.length ?? 0) > FIRM_PRODUCT_LIMITS.price) errors.push("Fiyat/Not 128 karakteri geçemez.");
  if ((value.note?.length ?? 0) > FIRM_PRODUCT_LIMITS.note) errors.push("Açıklama 500 karakteri geçemez.");
  return { ok: errors.length === 0, errors, value };
}

export function validateProductRows(rows: Array<Partial<FirmProductInput>>) {
  const seen = new Set<string>();
  return rows.map((row) => {
    const result = validateProductRow(row);
    const key = result.value.productName.toLocaleLowerCase("tr");
    if (key) {
      if (seen.has(key)) {
        result.ok = false;
        result.errors.push("Aynı dosyada yinelenen ürün adı.");
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
