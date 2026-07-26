import Link from "next/link";
import JsonLd from "./JsonLd";

export interface BreadcrumbItem {
  name: string;
  href: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  visible?: boolean;
}

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://haldefiyat.com").replace(/\/$/, "");

export default function Breadcrumb({ items, visible = false }: BreadcrumbProps) {
  const schema = {
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.href.startsWith("http") ? item.href : `${SITE_URL}${item.href}`,
    })),
  } satisfies Record<string, unknown>;

  return (
    <>
      <JsonLd type="BreadcrumbList" data={schema} />
      {visible && (
        <nav aria-label="Sayfa yolu" className="mb-6 text-[13px] text-(--color-muted)">
          <ol className="flex flex-wrap items-center gap-2">
            {items.map((item, index) => {
              const isCurrent = index === items.length - 1;
              return (
                <li key={`${item.href}-${index}`} className="flex min-w-0 items-center gap-2">
                  {index > 0 && <span aria-hidden>/</span>}
                  {isCurrent ? (
                    <span aria-current="page" className="truncate text-(--color-foreground)">
                      {item.name}
                    </span>
                  ) : (
                    <Link href={item.href} className="hover:text-(--color-brand)">
                      {item.name}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      )}
    </>
  );
}
