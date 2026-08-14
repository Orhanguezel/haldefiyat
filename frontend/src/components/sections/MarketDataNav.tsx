import Link from "next/link";

const ITEMS = [
  { key: "markets", href: "/hal", label: "Haller" },
  { key: "map", href: "/harita", label: "Fiyat haritası" },
  { key: "health", href: "/data-health", label: "Veri sağlığı" },
] as const;

export default function MarketDataNav({
  active,
}: {
  active: (typeof ITEMS)[number]["key"];
}) {
  return (
    <nav aria-label="Hal ve veri görünümü" className="mb-8 overflow-x-auto">
      <div className="inline-flex min-w-max gap-1 rounded-xl border border-(--color-border) bg-(--color-bg-alt) p-1">
        {ITEMS.map((item) => {
          const isActive = active === item.key;
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`inline-flex min-h-10 items-center rounded-lg px-4 text-sm font-semibold transition-colors ${
                isActive
                  ? "bg-(--color-brand) text-(--color-brand-fg)"
                  : "text-(--color-muted) hover:bg-(--color-surface) hover:text-(--color-foreground)"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

