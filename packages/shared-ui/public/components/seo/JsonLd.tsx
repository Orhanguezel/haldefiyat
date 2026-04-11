type Thing = Record<string, unknown>;

interface JsonLdProps {
  type?: string;
  data: Thing;
}

export function JsonLd({ type, data }: JsonLdProps) {
  const schema = type
    ? {
        "@context": "https://schema.org",
        "@type": type,
        ...data,
      }
    : data;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
