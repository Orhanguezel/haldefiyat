import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { formatOgDate } from "@/lib/og-date";

// DİNAMİK OG (route handler — i18n bağımsız), ürün OG pattern'inin analiz raporu
// replikası. URL: /og/analiz/[slug]. Her haftalık rapor kendi markalı kapak
// görselini otomatik üretir (ayrı yükleme gerekmez). `/api/` nginx'te Fastify'a
// gittiği için OG namespace'i `/og/`.

export const revalidate = 3600;
const IMAGE_SIZES = {
  "1x1": { width: 1200, height: 1200 },
  "4x3": { width: 1200, height: 900 },
  "16x9": { width: 1200, height: 675 },
} as const;

const API: string =
  process.env.BACKEND_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8091";

const BRAND = "#6FBD0F";
const INK = "#0A0E1A";

type Props = { params: Promise<{ slug: string }> };

async function loadFont(): Promise<ArrayBuffer | null> {
  try {
    const buf = await readFile(join(process.cwd(), "public", "fonts", "Outfit-800.ttf"));
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  } catch {
    return null;
  }
}

type ReportLite = { baslik?: string; hafta?: string; tarih?: string; etiketler?: string[] };

async function fetchReport(slug: string): Promise<ReportLite | null> {
  try {
    const res = await fetch(`${API}/api/v1/analysis/weekly-reports/${encodeURIComponent(slug)}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (data?.data ?? data ?? null) as ReportLite | null;
  } catch {
    return null;
  }
}

function titleFontSize(title: string): number {
  const len = title.length;
  if (len > 78) return 44;
  if (len > 58) return 52;
  if (len > 40) return 60;
  return 70;
}

type IndexPoint = { value: number; change: number | null };

/** Raporun ISO haftasına denk gelen endeks değeri + bir önceki haftaya göre değişim.
 *  Public /index/latest'ten okur; hafta formatı farklarını (2026-30 / 2026-W30) rakamla eşler. */
async function fetchIndexForWeek(isoWeek?: string): Promise<IndexPoint | null> {
  if (!isoWeek) return null;
  const norm = (s: string) => s.replace(/[^0-9]/g, "");
  const target = norm(isoWeek);
  try {
    const res = await fetch(`${API}/api/v1/index/latest`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const json = await res.json();
    const rows = (json?.data ?? json ?? []) as Array<{ indexWeek: string; indexValue: string; weekStart?: string }>;
    if (!Array.isArray(rows) || rows.length === 0) return null;
    const sorted = [...rows].sort((a, b) => norm(a.indexWeek).localeCompare(norm(b.indexWeek)));
    const idx = sorted.findIndex((r) => norm(r.indexWeek) === target);
    if (idx === -1) return null;
    const value = Number(sorted[idx]!.indexValue);
    const prev = idx > 0 ? Number(sorted[idx - 1]!.indexValue) : null;
    const change = prev && prev > 0 ? ((value - prev) / prev) * 100 : null;
    return { value, change };
  } catch {
    return null;
  }
}

function fmtTr(n: number, digits = 1): string {
  return n.toLocaleString("tr-TR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export async function GET(req: Request, { params }: Props) {
  const { slug } = await params;
  const ratio = new URL(req.url).searchParams.get("ratio");
  const size = IMAGE_SIZES[ratio === "1x1" || ratio === "4x3" ? ratio : "16x9"];
  const [report, font] = await Promise.all([fetchReport(slug), loadFont()]);
  const title: string = report?.baslik ?? "Haftalık Hal Raporu";
  const week: string = report?.hafta ? `Hafta ${report.hafta}` : "";
  const date = formatOgDate(report?.tarih);
  const endeks = await fetchIndexForWeek(report?.hafta);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: `linear-gradient(135deg, ${INK} 0%, #11203a 60%, ${INK} 100%)`,
          color: "#fff",
          padding: 72,
          fontFamily: font ? "Outfit" : "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: BRAND,
              color: INK,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 38,
              fontWeight: 800,
            }}
          >
            H
          </div>
          <div style={{ fontSize: 34, fontWeight: 800 }}>HalDeFiyat</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: "auto", gap: 14 }}>
          <div style={{ fontSize: 28, color: BRAND, fontWeight: 700 }}>Haftalık Hal Raporu</div>
          <div style={{ fontSize: titleFontSize(title), fontWeight: 800, lineHeight: 1.1 }}>{title}</div>
          <div style={{ fontSize: 26, color: "#9fb0c8", display: "flex", gap: 14 }}>
            {[date, week].filter(Boolean).join("  ·  ")}
          </div>
          {endeks && (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 22, marginTop: 20 }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 22, color: BRAND, fontWeight: 700, letterSpacing: 2 }}>HALDEFİYAT ENDEKSİ</div>
                <div style={{ fontSize: 104, fontWeight: 800, lineHeight: 1, color: "#fff" }}>{fmtTr(endeks.value)}</div>
              </div>
              {endeks.change != null && (
                <div
                  style={{
                    display: "flex",
                    padding: "8px 20px",
                    borderRadius: 999,
                    marginBottom: 16,
                    background: endeks.change < 0 ? "rgba(29,158,117,0.20)" : "rgba(216,90,48,0.20)",
                    color: endeks.change < 0 ? "#3ddc97" : "#ff8a5c",
                    fontSize: 36,
                    fontWeight: 800,
                  }}
                >
                  {`${endeks.change < 0 ? "−" : "+"}%${fmtTr(Math.abs(endeks.change))}`}
                </div>
              )}
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 40,
            borderTop: "2px solid rgba(255,255,255,0.12)",
            paddingTop: 24,
            fontSize: 26,
            color: "#cdd7e6",
          }}
        >
          <div>haldefiyat.com</div>
          <div>Resmi belediye + HKS verileri</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: font ? [{ name: "Outfit", data: font, weight: 800, style: "normal" }] : [],
    },
  );
}
