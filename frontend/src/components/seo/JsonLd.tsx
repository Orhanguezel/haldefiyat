type JsonLdType =
  | "Organization"
  | "WebSite"
  | "LocalBusiness"
  | "Article"
  | "BlogPosting"
  | "NewsArticle"
  | "DataFeed"
  | "Product"
  | "BreadcrumbList"
  | "FAQPage"
  | "Dataset"
  | "Place";

interface JsonLdProps {
  type: JsonLdType;
  data: Record<string, unknown>;
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
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
