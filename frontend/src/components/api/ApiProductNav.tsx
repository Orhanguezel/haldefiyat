import Link from "next/link";

const ITEMS = [
  ["API Pro", "/pro"],
  ["Dokümantasyon", "/api-docs"],
  ["Kullanım politikası", "/api-policy"],
  ["Bülten aboneliği", "/abonelik"],
] as const;

export default function ApiProductNav({ current }: { current: string }) {
  return (
    <nav aria-label="API ve abonelik ürün yolları" className="mb-8 flex flex-wrap gap-2 rounded-[10px] border border-(--color-border) bg-(--color-surface) p-2">
      {ITEMS.map(([label, href]) => (
        <Link
          key={href}
          href={href}
          aria-current={current === href ? "page" : undefined}
          className={`rounded-[7px] px-3 py-2 text-xs font-semibold transition ${
            current === href ? "bg-(--color-brand) text-white" : "text-(--color-muted) hover:bg-(--color-bg-alt) hover:text-(--color-foreground)"
          }`}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
