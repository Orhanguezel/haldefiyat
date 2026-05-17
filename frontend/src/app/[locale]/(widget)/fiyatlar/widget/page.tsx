export const revalidate = 300;

import { fetchWidget } from "@/lib/api";

type Props = {
  searchParams: Promise<{
    theme?: string;
    category?: string;
    limit?: string;
    slugs?: string;
    title?: string;
  }>;
};

function fmtPrice(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(value);
}

function fmtPct(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "Yeni";
  const sign = value > 0 ? "▲" : value < 0 ? "▼" : "●";
  return `${sign} ${Math.abs(value).toFixed(1)}%`;
}

export default async function FiyatlarWidget({ searchParams }: Props) {
  const params = await searchParams;
  const theme = params.theme === "light" ? "light" : "dark";
  const limit = Math.min(12, Math.max(3, Number(params.limit) || 6));
  const slugs = params.slugs
    ?.split(",")
    .map((slug) => slug.trim())
    .filter(Boolean);
  const title = params.title?.trim() || "Güncel Hal Fiyatları";

  const items = await fetchWidget({
    category: params.category,
    slugs,
    limit,
  });

  const isDark = theme === "dark";
  const bg = isDark ? "#0f1117" : "#ffffff";
  const surface = isDark ? "#171a23" : "#f8fafc";
  const border = isDark ? "#2a2d36" : "#e5e7eb";
  const muted = isDark ? "#9ca3af" : "#64748b";
  const faint = isDark ? "#6b7280" : "#94a3b8";
  const fg = isDark ? "#f9fafb" : "#111827";
  const brand = "#84f04c";
  const danger = "#f87171";

  return (
    <>
      <style>{`
        .hf-widget, .hf-widget * { box-sizing: border-box; margin: 0; padding: 0; }
        .hf-widget {
          min-height: 100vh;
          background: ${bg};
          color: ${fg};
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
      `}</style>
      <div className="hf-widget">
        <a
          href="https://haldefiyat.com/fiyatlar"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "block", color: "inherit", textDecoration: "none" }}
        >
          <div
            style={{
              width: "100%",
              minWidth: "300px",
              maxWidth: "420px",
              background: bg,
              border: `1px solid ${border}`,
              borderRadius: "16px",
              padding: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "12px" }}>
              <div>
                <div style={{ fontSize: "10px", fontWeight: 700, color: brand, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  HaldeFiyat
                </div>
                <h1 style={{ marginTop: "3px", fontSize: "16px", lineHeight: 1.2, fontWeight: 750, color: fg }}>
                  {title}
                </h1>
              </div>
              <span style={{ flex: "0 0 auto", borderRadius: "999px", border: `1px solid ${border}`, padding: "5px 8px", fontSize: "10px", color: muted }}>
                Canlı veri
              </span>
            </div>

            {items.length ? (
              <div style={{ display: "grid", gap: "8px" }}>
                {items.map((item) => {
                  const pct = item.changePct;
                  const pctColor = pct === null ? faint : pct >= 0 ? danger : brand;
                  return (
                    <div
                      key={item.productSlug}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(0,1fr) auto",
                        gap: "10px",
                        alignItems: "center",
                        background: surface,
                        border: `1px solid ${border}`,
                        borderRadius: "12px",
                        padding: "10px 12px",
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "13px", fontWeight: 700, color: fg }}>
                          {item.productName}
                        </div>
                        <div style={{ marginTop: "3px", fontSize: "10px", color: faint }}>
                          {item.categorySlug} · {item.unit}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "14px", fontWeight: 800, color: fg }}>
                          {fmtPrice(item.avgPrice)}
                        </div>
                        <div style={{ marginTop: "3px", fontSize: "10px", fontWeight: 700, color: pctColor }}>
                          {fmtPct(pct)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ border: `1px dashed ${border}`, borderRadius: "12px", padding: "16px", fontSize: "13px", color: muted }}>
                Fiyat verisi yüklenemedi.
              </p>
            )}

            <div style={{ marginTop: "12px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", fontSize: "10px", color: muted }}>
              <span>5 dk önbellek · haftalık değişim</span>
              <span>haldefiyat.com ↗</span>
            </div>
          </div>
        </a>
      </div>
    </>
  );
}
