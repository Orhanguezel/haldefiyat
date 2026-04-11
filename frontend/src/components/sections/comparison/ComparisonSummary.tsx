"use client";

import { getEmoji } from "@/lib/emoji";
import type { SummaryRow } from "./types";

interface ComparisonSummaryProps {
  summary: SummaryRow[];
}

function formatPrice(v: number): string {
  return `₺${v.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ComparisonSummary({ summary }: ComparisonSummaryProps) {
  if (summary.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-surface)">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13px]">
          <thead className="border-b border-(--color-border) bg-(--color-bg-alt)/50">
            <tr className="font-(family-name:--font-mono) text-[10px] uppercase tracking-[0.12em] text-(--color-muted)">
              <th className="px-4 py-3 font-semibold">Ürün</th>
              <th className="px-4 py-3 text-right font-semibold">Son Fiyat</th>
              <th className="px-4 py-3 text-right font-semibold">Min</th>
              <th className="px-4 py-3 text-right font-semibold">Maks</th>
              <th className="px-4 py-3 text-right font-semibold">Ortalama</th>
              <th className="px-4 py-3 text-right font-semibold">Değişim</th>
            </tr>
          </thead>
          <tbody>
            {summary.map((row) => (
              <tr
                key={row.product.slug}
                className="border-b border-(--color-border)/60 last:border-0"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: row.color }}
                      aria-hidden
                    />
                    <span className="text-xl">{getEmoji(row.product.slug)}</span>
                    <span className="font-medium text-(--color-foreground)">
                      {row.product.nameTr}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-(family-name:--font-mono) font-semibold text-(--color-foreground)">
                  {formatPrice(row.latest)}
                </td>
                <td className="px-4 py-3 text-right font-(family-name:--font-mono) text-(--color-muted)">
                  {formatPrice(row.min)}
                </td>
                <td className="px-4 py-3 text-right font-(family-name:--font-mono) text-(--color-muted)">
                  {formatPrice(row.max)}
                </td>
                <td className="px-4 py-3 text-right font-(family-name:--font-mono) text-(--color-muted)">
                  {formatPrice(row.avg)}
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={
                      "inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-(family-name:--font-mono) text-[11px] font-semibold " +
                      (row.changePct > 0
                        ? "bg-(--color-danger)/15 text-(--color-danger)"
                        : row.changePct < 0
                          ? "bg-(--color-success)/15 text-(--color-success)"
                          : "bg-(--color-bg-alt) text-(--color-muted)")
                    }
                  >
                    {row.changePct > 0 ? "▲" : row.changePct < 0 ? "▼" : "—"}
                    {Math.abs(row.changePct).toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
