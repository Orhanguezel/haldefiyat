type ProductLinkSource = {
  productSlug?: string | null;
  slug?: string | null;
  canonicalProduct?: string | null;
  canonicalSlug?: string | null;
};

const ACTIVE_PRODUCT_REDIRECTS: Readonly<Record<string, string>> = {
  "armut-diger": "armut",
  biber: "biber-carliston",
  "biber-kapya": "kapya-biber",
  "domates-ceri": "domates-cherry",
  "domates-koy": "domates",
  "fasulye-taze-diger": "fasulye",
  "k-sogan": "sogan-kuru",
  "kabak-dolmalik": "kabak",
  "karpuz-muhtelif": "karpuz",
  lahana: "lahana-beyaz",
  "mandalina-diger": "mandalina",
  "muz-muz-yerli-anamur": "muz-yerli",
  sarimsak: "sarimsak-kuru",
  "y-sogan": "sogan-taze",
};

export function productHref(product: ProductLinkSource): string {
  const candidate = product.canonicalProduct?.trim()
    || product.canonicalSlug?.trim()
    || product.productSlug?.trim()
    || product.slug?.trim()
    || "";
  if (!candidate) return "/fiyatlar";
  const slug = ACTIVE_PRODUCT_REDIRECTS[candidate] ?? candidate;
  return `/urun/${encodeURIComponent(slug)}`;
}
