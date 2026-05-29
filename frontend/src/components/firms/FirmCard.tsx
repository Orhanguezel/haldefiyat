import Link from "next/link";
import type { Firm } from "@/lib/api";

const TYPE_LABELS: Record<Firm["firmType"], string> = {
  komisyoncu: "Komisyoncu",
  soguk_hava: "Soğuk Hava",
  nakliye: "Nakliye",
  zirai_ilac: "Zirai İlaç",
};

function titleCaseSlug(value?: string | null): string {
  if (!value) return "Türkiye";
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toLocaleUpperCase("tr") + part.slice(1))
    .join(" ");
}

export default function FirmCard({ firm, compact = false }: { firm: Firm; compact?: boolean }) {
  const sponsored = Boolean(firm.sponsorshipTier);

  return (
    <Link
      href={`/firma/${firm.slug}`}
      className="group flex min-h-[150px] gap-4 rounded-[8px] border border-(--color-border) bg-(--color-surface) p-4 transition-colors hover:border-(--color-brand)/45 hover:bg-(--color-bg-alt)"
    >
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[6px] border border-(--color-border-soft) bg-(--color-bg-alt)">
        {firm.photoUrl ? (
          <img src={firm.photoUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-(family-name:--font-display) text-xl font-bold text-(--color-brand)">
            {firm.name.charAt(0).toLocaleUpperCase("tr")}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-(--color-brand)/25 px-2 py-0.5 font-(family-name:--font-mono) text-[10px] font-semibold uppercase tracking-[0.08em] text-(--color-brand)">
            {TYPE_LABELS[firm.firmType]}
          </span>
          {sponsored && (
            <span className="rounded-full bg-(--color-brand)/12 px-2 py-0.5 font-(family-name:--font-mono) text-[10px] font-semibold text-(--color-brand)">
              Sponsorlu
            </span>
          )}
        </div>
        <h3 className="line-clamp-2 font-(family-name:--font-display) text-[17px] font-bold text-(--color-foreground)">
          {firm.name}
        </h3>
        <p className="mt-1 font-(family-name:--font-mono) text-[11px] text-(--color-muted)">
          {titleCaseSlug(firm.citySlug)}
          {firm.districtSlug ? ` · ${titleCaseSlug(firm.districtSlug)}` : ""}
        </p>
        {!compact && firm.address && (
          <p className="mt-2 line-clamp-2 text-[12px] leading-5 text-(--color-muted)">
            {firm.address}
          </p>
        )}
        <span className="mt-3 inline-flex font-(family-name:--font-mono) text-[11px] font-semibold text-(--color-brand)">
          Profil detayları
        </span>
      </div>
    </Link>
  );
}
