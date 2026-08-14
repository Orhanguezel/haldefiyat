import Link from "next/link";

const POLICY_LINKS = [
  ["Metodoloji", "/metodoloji"],
  ["Veri Kaynağı", "/veri-kaynagi-politikasi"],
  ["Editoryal", "/editoryal-politika"],
  ["Düzeltme", "/duzeltme-politikasi"],
  ["KVKK", "/kvkk"],
  ["Gizlilik", "/gizlilik-politikasi"],
  ["Kullanım", "/kullanim-kosullari"],
  ["API Kullanımı", "/api-policy"],
  ["Sahiplik", "/sahiplik-finansman"],
] as const;

export default function PolicyLinks({ className = "", currentPath }: { className?: string; currentPath?: string }) {
  return (
    <nav
      aria-label="Şeffaflık ve politika bağlantıları"
      className={`rounded-xl border border-(--color-border) bg-(--color-bg-alt) p-5 ${className}`}
    >
      <h2 className="text-sm font-semibold text-(--color-foreground)">İlgili politika ve açıklamalar</h2>
      <ul className="mt-3 flex flex-wrap gap-2">
        {POLICY_LINKS.map(([label, href]) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={currentPath === href ? "page" : undefined}
              className="inline-flex min-h-9 items-center rounded-lg border border-(--color-border) bg-(--color-surface) px-3 text-xs font-medium text-(--color-foreground) transition-colors hover:border-(--color-brand)/45 hover:text-(--color-brand)"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
