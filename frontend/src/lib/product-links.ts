type ProductLinkSource = {
  productSlug: string;
  canonicalProduct?: string | null;
};

export function productHref(product: ProductLinkSource): string {
  const slug = product.canonicalProduct?.trim() || product.productSlug.trim();
  return `/urun/${encodeURIComponent(slug)}`;
}
