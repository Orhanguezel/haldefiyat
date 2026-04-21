export const revalidate = 300;

import { fetchIndexLatest, fetchIndexHistory } from "@/lib/api";
import type { IndexSnapshot } from "@/lib/api";

type Props = {
  searchParams: Promise<{ theme?: string }>;
};

export default async function EndeksWidget({ searchParams }: Props) {
  const { theme: rawTheme } = await searchParams;
  const theme = rawTheme === "light" ? "light" : "dark";

  const [latest, history] = await Promise.all([
    fetchIndexLatest(),
    fetchIndexHistory(8),
  ]);

  const prevValue   = history.length >= 2 ? parseFloat(history[history.length - 2]!.indexValue) : null;
  const curValue    = latest ? parseFloat(latest.indexValue) : null;
  const weeklyDelta = curValue !== null && prevValue !== null
    ? Math.round((curValue - prevValue) * 100) / 100
    : null;

  const isDark = theme === "dark";

  const bg      = isDark ? "#0f1117" : "#ffffff";
  const border  = isDark ? "#2a2d36" : "#e5e7eb";
  const muted   = isDark ? "#6b7280" : "#9ca3af";
  const fg      = isDark ? "#f9fafb" : "#111827";
  const brand   = "#84f04c";
  const danger  = "#f87171";

  return (
    <>
      <style>{`
        .hf-widget, .hf-widget * { box-sizing: border-box; margin: 0; padding: 0; }
        .hf-widget { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: ${bg}; min-height: 100vh; }
      `}</style>
      <div className="hf-widget">
        <a
          href="https://haldefiyat.com/endeks"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "block", textDecoration: "none", color: "inherit" }}
        >
          <div style={{
            background: bg,
            border: `1px solid ${border}`,
            borderRadius: "14px",
            padding: "16px 18px 14px",
            width: "100%",
            minWidth: "260px",
            maxWidth: "340px",
            cursor: "pointer",
          }}>
            {/* Üst: logo + etiket */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{
                  width: "20px", height: "20px", borderRadius: "5px",
                  background: brand, display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <polyline points="1,9 4,5 7,7 11,2" stroke="#0f1117" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  </svg>
                </div>
                <span style={{ fontSize: "11px", fontWeight: 600, color: muted, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  HaldeFiyat Endeksi
                </span>
              </div>
              {latest && (
                <span style={{ fontSize: "10px", color: muted }}>
                  Hafta {latest.indexWeek}
                </span>
              )}
            </div>

            {/* Ana değer */}
            {latest && curValue !== null ? (
              <>
                <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "6px" }}>
                  <span style={{ fontSize: "34px", fontWeight: 700, color: fg, lineHeight: 1 }}>
                    {curValue.toFixed(2)}
                  </span>
                  {weeklyDelta !== null && (
                    <span style={{
                      fontSize: "13px", fontWeight: 600,
                      color: weeklyDelta >= 0 ? danger : brand,
                    }}>
                      {weeklyDelta >= 0 ? "▲" : "▼"} {Math.abs(weeklyDelta).toFixed(2)}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: "11px", color: muted, marginBottom: "12px" }}>
                  Baz {latest.baseWeek} · Sepet {parseFloat(latest.basketAvg).toFixed(2)} ₺/kg · {latest.productsCount} ürün
                </p>

                {/* Mini SVG grafik */}
                {history.length >= 2 && (
                  <MiniChart snapshots={history} brand={brand} muted={muted} />
                )}
              </>
            ) : (
              <p style={{ fontSize: "13px", color: muted, padding: "12px 0" }}>
                Veri yükleniyor...
              </p>
            )}

            {/* Alt: kaynak linki */}
            <div style={{ marginTop: "10px", display: "flex", justifyContent: "flex-end" }}>
              <span style={{ fontSize: "10px", color: muted }}>
                haldefiyat.com ↗
              </span>
            </div>
          </div>
        </a>
      </div>
    </>
  );
}

function MiniChart({ snapshots, brand, muted }: { snapshots: IndexSnapshot[]; brand: string; muted: string }) {
  const values = snapshots.map((s) => parseFloat(s.indexValue));
  const min    = Math.min(...values);
  const max    = Math.max(...values);
  const range  = max - min || 1;

  const W = 280; const H = 44; const PAD = 4;

  const pts = values.map((v, i) => {
    const x = PAD + (i / (values.length - 1)) * (W - PAD * 2);
    const y = PAD + (1 - (v - min) / range) * (H - PAD * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const first = pts[0]!.split(",");
  const last  = pts[pts.length - 1]!.split(",");

  // Dolgu alanı
  const area = `${PAD},${H - PAD} ${pts.join(" ")} ${W - PAD},${H - PAD}`;

  const baseY = (PAD + (1 - (100 - min) / range) * (H - PAD * 2)).toFixed(1);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "44px", display: "block" }}>
      {/* Baz çizgisi */}
      <line x1={PAD} y1={baseY} x2={W - PAD} y2={baseY}
        stroke={brand} strokeWidth="0.8" strokeDasharray="3 2" opacity="0.3" />
      {/* Alan dolgusu */}
      <polygon points={area} fill={brand} opacity="0.06" />
      {/* Trend çizgisi */}
      <polyline points={pts.join(" ")}
        fill="none" stroke={brand} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />
      {/* İlk nokta */}
      <circle cx={first[0]} cy={first[1]} r="2.5" fill={muted} opacity="0.5" />
      {/* Son nokta */}
      <circle cx={last[0]} cy={last[1]} r="3.5" fill={brand} />
    </svg>
  );
}
