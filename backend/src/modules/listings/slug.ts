const TR_MAP: Record<string, string> = {
  ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u",
  Ç: "c", Ğ: "g", İ: "i", I: "i", Ö: "o", Ş: "s", Ü: "u",
};

export function slugifyListingPart(value: string): string {
  return value
    .replace(/[çğıöşüÇĞİIÖŞÜ]/g, (char) => TR_MAP[char] ?? char)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "ilan";
}

export function buildListingSlug(input: {
  id: number;
  productSlug?: string | null;
  title: string;
  citySlug?: string | null;
}): string {
  const product = input.productSlug || slugifyListingPart(input.title);
  const city = input.citySlug || "turkiye";
  return `${slugifyListingPart(product)}-${slugifyListingPart(city)}-${input.id}`;
}

