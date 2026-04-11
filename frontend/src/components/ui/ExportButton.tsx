"use client";

import { useMemo } from "react";

interface ExportButtonProps {
  params?: {
    product?: string;
    city?: string;
    category?: string;
    range?: string;
  };
  label?: string;
}

const API_BASE: string = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/api/v1`
  : "/api/v1";

function buildUrl(params: ExportButtonProps["params"]): string {
  const qs = new URLSearchParams();
  qs.set("format", "csv");
  if (params?.product) qs.set("product", params.product);
  if (params?.city) qs.set("city", params.city);
  if (params?.category) qs.set("category", params.category);
  if (params?.range) qs.set("range", params.range);
  return `${API_BASE}/prices/export?${qs.toString()}`;
}

/**
 * CSV export button.
 *
 * NEDEN client: window.location.href ile browser native download tetikler,
 * ekstra fetch/blob yonetimi yok. Server component'lerden props ile besler.
 */
export default function ExportButton({ params, label = "CSV İndir" }: ExportButtonProps) {
  const href = useMemo(() => buildUrl(params), [params]);

  const onClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    window.location.href = href;
  };

  return (
    <a
      href={href}
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-[10px] border border-(--color-brand)/40 bg-(--color-brand)/5 px-4 py-2 font-(family-name:--font-mono) text-[12px] font-semibold uppercase tracking-[0.08em] text-(--color-brand) transition-colors hover:border-(--color-brand) hover:bg-(--color-brand)/10"
      aria-label="Fiyatları CSV olarak indir"
      download
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        <path d="M10 3v11m0 0l-4-4m4 4l4-4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 17h14" strokeLinecap="round" />
      </svg>
      {label}
    </a>
  );
}
