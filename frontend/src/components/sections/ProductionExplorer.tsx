"use client";

import { useMemo, useState } from "react";
import type { ProductionRow, ProductionSpeciesRow } from "@/lib/api";

interface Props {
  initialRows: ProductionRow[];
  species:     ProductionSpeciesRow[];
}

const CATEGORY_LABEL: Record<string, string> = {
  "balik-kultur":   "Kültür Balıkçılığı",
  "balik-deniz":    "Deniz",
  "balik-tatlisu":  "Tatlı Su",
  "balik-ithal":    "İthal",
  "balik-donuk":    "Donuk",
  diger:            "Diğer",
};

function humanize(slug: string): string {
  return (
    CATEGORY_LABEL[slug] ??
    slug
      .split("-")
      .filter(Boolean)
      .map((w) => w.charAt(0).toLocaleUpperCase("tr-TR") + w.slice(1))
      .join(" ")
  );
}

function fmtTon(value: string): string {
  const n = parseFloat(value);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export default function ProductionExplorer({ initialRows, species }: Props) {
  const safeRows = Array.isArray(initialRows) ? initialRows : [];
  const safeSpecies = Array.isArray(species) ? species : [];

  const [selectedSpecies, setSelectedSpecies] = useState<string>("all");

  const filtered = useMemo(() => {
    if (selectedSpecies === "all") return safeRows;
    return safeRows.filter((r) => r.speciesSlug === selectedSpecies);
  }, [safeRows, selectedSpecies]);

  // Basit SVG çizgi grafik — dış bağımlılık yok
  const chartData = useMemo(() => {
    if (selectedSpecies === "all") return null;
    const points = safeRows
      .filter((r) => r.speciesSlug === selectedSpecies)
      .map((r) => ({ year: r.year, ton: parseFloat(r.productionTon) }))
      .filter((p) => Number.isFinite(p.ton))
      .sort((a, b) => a.year - b.year);
    if (points.length < 2) return null;
    const minY = Math.min(...points.map((p) => p.ton));
    const maxY = Math.max(...points.map((p) => p.ton));
    const minX = points[0]!.year;
    const maxX = points[points.length - 1]!.year;
    return { points, minX, maxX, minY, maxY };
  }, [safeRows, selectedSpecies]);

  return (
    <div className="space-y-6">
      {safeSpecies.length === 0 ? (
        <div className="rounded-[14px] border border-(--color-border) bg-(--color-surface) p-8 text-center">
          <p className="text-[14px] text-(--color-muted)">
            Henüz üretim verisi yok. Admin panelden ETL tetiklendikten sonra
            veriler buraya gelir.
          </p>
        </div>
      ) : (
        <>
          {/* Tür seçici */}
          <div className="flex flex-col gap-3 rounded-[14px] border border-(--color-border) bg-(--color-surface) p-4 md:flex-row md:items-center">
            <label
              htmlFor="species"
              className="font-(family-name:--font-mono) text-[11px] font-semibold uppercase tracking-[0.1em] text-(--color-muted)"
            >
              Tür
            </label>
            <select
              id="species"
              value={selectedSpecies}
              onChange={(e) => setSelectedSpecies(e.target.value)}
              className="flex-1 rounded-[8px] border border-(--color-border) bg-(--color-bg-alt) px-3 py-2 text-[13px] text-(--color-foreground) focus:border-(--color-brand) focus:outline-none md:max-w-sm"
            >
              <option value="all">Tümü ({safeSpecies.length} tür)</option>
              {safeSpecies.map((s) => (
                <option key={s.speciesSlug} value={s.speciesSlug}>
                  {s.species} ({s.firstYear}–{s.lastYear})
                </option>
              ))}
            </select>
            <span className="font-(family-name:--font-mono) text-[11px] uppercase tracking-[0.1em] text-(--color-muted)">
              {filtered.length} kayıt
            </span>
          </div>

          {/* Basit trend grafiği */}
          {chartData && (
            <div className="rounded-[14px] border border-(--color-border) bg-(--color-surface) p-6">
              <h3 className="mb-4 font-(family-name:--font-display) text-[16px] font-bold text-(--color-foreground)">
                Yıllık Üretim Trendi (Ton)
              </h3>
              <LineChart data={chartData} />
            </div>
          )}

          {/* Kayıt tablosu */}
          <div className="overflow-x-auto rounded-[14px] border border-(--color-border) bg-(--color-surface)">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-(--color-border) text-left">
                  {["Yıl", "Tür", "Kategori", "Bölge", "Üretim (Ton)", "Kaynak"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 font-(family-name:--font-mono) text-[11px] font-semibold uppercase tracking-[0.1em] text-(--color-muted)"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-12 text-center text-[13px] text-(--color-muted)"
                    >
                      Seçili kritere uyan kayıt yok.
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-(--color-border)/50 transition-colors last:border-b-0 hover:bg-(--color-bg-alt)"
                    >
                      <td className="px-4 py-3 font-(family-name:--font-mono) text-[13px] text-(--color-foreground)">
                        {r.year}
                      </td>
                      <td className="px-4 py-3 text-[14px] font-semibold text-(--color-foreground)">
                        {r.species}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-(--color-muted)">
                        {humanize(r.categorySlug)}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-(--color-muted)">
                        {humanize(r.regionSlug)}
                      </td>
                      <td className="px-4 py-3 text-right font-(family-name:--font-mono) text-[14px] font-bold text-(--color-foreground)">
                        {fmtTon(r.productionTon)}
                      </td>
                      <td className="px-4 py-3 font-(family-name:--font-mono) text-[10px] uppercase tracking-[0.05em] text-(--color-muted)">
                        {r.sourceApi.split("_")[0]}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function LineChart({
  data,
}: {
  data: {
    points: { year: number; ton: number }[];
    minX:   number;
    maxX:   number;
    minY:   number;
    maxY:   number;
  };
}) {
  const W = 800;
  const H = 260;
  const P = 40;
  const spanX = Math.max(1, data.maxX - data.minX);
  const spanY = Math.max(1, data.maxY - data.minY);
  const x = (year: number) => P + ((year - data.minX) / spanX) * (W - P * 2);
  const y = (ton: number) => H - P - ((ton - data.minY) / spanY) * (H - P * 2);

  const pathD = data.points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${x(p.year).toFixed(1)} ${y(p.ton).toFixed(1)}`)
    .join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Üretim trend grafiği">
      {/* Izgara */}
      {[0, 0.25, 0.5, 0.75, 1].map((t) => {
        const gy = P + t * (H - P * 2);
        const val = data.maxY - t * spanY;
        return (
          <g key={t}>
            <line x1={P} y1={gy} x2={W - P} y2={gy} stroke="currentColor" strokeOpacity={0.1} />
            <text
              x={P - 6}
              y={gy + 4}
              fontSize={10}
              textAnchor="end"
              fill="currentColor"
              fillOpacity={0.5}
            >
              {Math.round(val).toLocaleString("tr-TR")}
            </text>
          </g>
        );
      })}
      {/* X ekseninde yıllar */}
      {data.points.map((p) => (
        <text
          key={p.year}
          x={x(p.year)}
          y={H - P + 15}
          fontSize={10}
          textAnchor="middle"
          fill="currentColor"
          fillOpacity={0.5}
        >
          {p.year}
        </text>
      ))}
      <path d={pathD} fill="none" stroke="var(--color-brand, #22c55e)" strokeWidth={2} />
      {data.points.map((p) => (
        <circle
          key={p.year}
          cx={x(p.year)}
          cy={y(p.ton)}
          r={3.5}
          fill="var(--color-brand, #22c55e)"
        />
      ))}
    </svg>
  );
}
