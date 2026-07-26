type JsonLdType =
  | "Organization"
  | "WebSite"
  | "LocalBusiness"
  | "Article"
  | "BlogPosting"
  | "NewsArticle"
  | "DataFeed"
  | "DataCatalog"
  | "Product"
  | "BreadcrumbList"
  | "FAQPage"
  | "ItemList"
  | "CollectionPage"
  | "Dataset"
  | "Place"
  | "Person"
  | "ProfilePage";

interface JsonLdProps {
  type: JsonLdType;
  data: Record<string, unknown>;
}

/**
 * JSON-LD is embedded in an HTML script element, so JSON.stringify alone is
 * insufficient: a CMS/API value containing `</script>` could close the tag.
 * Escaping HTML-significant characters keeps the payload valid JSON while
 * preventing it from being interpreted as markup.
 */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/&/g, "\\u0026")
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

/**
 * Schema.org JSON-LD emitter (server component).
 *
 * NEDEN: Google Rich Results icin yapisal veri. `type` union olarak kisitli —
 * type guvenligi korunurken, generic `data` objesi ile tum property'ler
 * gecirilir. schema.org referansiyla tutarli kalmak icin `@context` ve
 * `@type` burada eklenir, cagiranin bilmesi gerekmez.
 */
export default function JsonLd({ type, data }: JsonLdProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": type,
    ...data,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
    />
  );
}
