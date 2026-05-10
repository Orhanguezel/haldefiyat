import JsonLd from "./JsonLd";

export interface BreadcrumbItem {
  name: string;
  href: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://haldefiyat.com").replace(/\/$/, "");

export default function Breadcrumb({ items }: BreadcrumbProps) {
  const schema = {
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.href.startsWith("http") ? item.href : `${SITE_URL}${item.href}`,
    })),
  } satisfies Record<string, unknown>;

  return <JsonLd type="BreadcrumbList" data={schema} />;
}
