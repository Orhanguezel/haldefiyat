// ===================================================================
// FILE: src/modules/social/chart.ts
// Günlük "hal hareketleri" grafiği — temiz yatay bar PNG (X medyası).
// SVG → sharp PNG → storage upload (local/cloudinary) → public URL.
// ===================================================================

import sharp from "sharp";
import { getCloudinaryConfig, uploadBufferAuto } from "@agro/shared-backend/modules/storage";
import { env } from "@/core/env";

const WIDTH = 1200;
const HEIGHT = 675;

export type ChartRow = { name: string; changePct: number; latest: number };

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]!));
}

function fmtPrice(n: number): string {
  return n.toLocaleString("tr-TR", { maximumFractionDigits: n >= 100 ? 0 : 1 });
}

function clip(s: string, max = 22): string {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

function chartSvg(title: string, subtitle: string, rows: ChartRow[]): string {
  const data = rows.slice(0, 5);
  const max = Math.max(...data.map((r) => Math.abs(r.changePct)), 1);

  // Sol etiket kolonu | bar | yüzde | fiyat — çakışma yok.
  const labelX = 64;
  const barX = 470;
  const barMax = 470; // barX + barMax + değer alanı < 1156
  const top = 210;
  const rowH = 64;
  const gap = 20;

  const bars = data
    .map((r, i) => {
      const cy = top + i * (rowH + gap);
      const mid = cy + rowH / 2;
      const w = Math.max(36, Math.round((Math.abs(r.changePct) / max) * barMax));
      const rising = r.changePct >= 0;
      const color = rising ? "#16a34a" : "#dc2626";
      const arrow = rising ? "▲" : "▼";
      const pct = `${arrow} %${Math.abs(r.changePct).toFixed(1)}`;
      return `
      <text x="${labelX}" y="${mid + 9}" font-size="27" font-weight="700" fill="#172033">${escapeXml(clip(r.name))}</text>
      <rect x="${barX}" y="${cy + 10}" width="${w}" height="${rowH - 20}" rx="12" fill="${color}" opacity="0.92"/>
      <text x="${barX + w + 18}" y="${mid + 9}" font-size="26" font-weight="700" fill="${color}">${escapeXml(pct)}</text>
      <text x="${WIDTH - 56}" y="${mid + 9}" text-anchor="end" font-size="24" fill="#526070">₺${escapeXml(fmtPrice(r.latest))}</text>`;
    })
    .join("\n");

  return `<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${WIDTH}" height="${HEIGHT}" fill="#f1f5f9"/>
    <rect x="40" y="40" width="${WIDTH - 80}" height="${HEIGHT - 80}" rx="28" fill="#ffffff" stroke="#dbe3ec"/>
    <text x="${labelX}" y="120" font-size="44" font-weight="800" fill="#0f172a">${escapeXml(title)}</text>
    <text x="${labelX}" y="162" font-size="26" fill="#64748b">${escapeXml(subtitle)}</text>
    <line x1="${labelX}" y1="184" x2="${WIDTH - 56}" y2="184" stroke="#e2e8f0" stroke-width="2"/>
    ${bars}
    <text x="${labelX}" y="${HEIGHT - 58}" font-size="26" font-weight="800" fill="#16a34a">haldefiyat.com</text>
    <text x="${WIDTH - 56}" y="${HEIGHT - 58}" text-anchor="end" font-size="22" fill="#94a3b8">Kaynak: hal fiyat verisi</text>
  </svg>`;
}

export type StapleRow = { name: string; price: number; changePct: number | null };

// Popüler ürün fiyatları — 2 sütunlu temiz fiyat tablosu.
function staplesGridSvg(title: string, subtitle: string, rows: StapleRow[]): string {
  const data = rows.slice(0, 10);
  const cols = 2;
  const colW = (WIDTH - 96 - 40) / cols; // sol/sağ kenar + sütun arası
  const top = 210;
  const rowH = 78;

  const cells = data
    .map((r, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = 56 + col * (colW + 40);
      const y = top + row * rowH;
      const mid = y + rowH / 2;
      const up = (r.changePct ?? 0) >= 0;
      const chg =
        r.changePct == null ? "" : `${up ? "▲" : "▼"} %${Math.abs(r.changePct).toFixed(1)}`;
      const chgColor = r.changePct == null ? "#94a3b8" : up ? "#16a34a" : "#dc2626";
      return `
      <rect x="${x}" y="${y + 8}" width="${colW}" height="${rowH - 16}" rx="14" fill="#f8fafc" stroke="#e2e8f0"/>
      <text x="${x + 24}" y="${mid + 9}" font-size="28" font-weight="700" fill="#172033">${escapeXml(clip(r.name, 18))}</text>
      <text x="${x + colW - 24}" y="${mid - 4}" text-anchor="end" font-size="30" font-weight="800" fill="#0f172a">₺${escapeXml(fmtPrice(r.price))}</text>
      <text x="${x + colW - 24}" y="${mid + 26}" text-anchor="end" font-size="20" font-weight="700" fill="${chgColor}">${escapeXml(chg)}</text>`;
    })
    .join("\n");

  return `<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${WIDTH}" height="${HEIGHT}" fill="#f1f5f9"/>
    <rect x="40" y="40" width="${WIDTH - 80}" height="${HEIGHT - 80}" rx="28" fill="#ffffff" stroke="#dbe3ec"/>
    <text x="56" y="120" font-size="44" font-weight="800" fill="#0f172a">${escapeXml(title)}</text>
    <text x="56" y="162" font-size="26" fill="#64748b">${escapeXml(subtitle)}</text>
    <line x1="56" y1="184" x2="${WIDTH - 56}" y2="184" stroke="#e2e8f0" stroke-width="2"/>
    ${cells}
    <text x="56" y="${HEIGHT - 58}" font-size="26" font-weight="800" fill="#16a34a">haldefiyat.com</text>
    <text x="${WIDTH - 56}" y="${HEIGHT - 58}" text-anchor="end" font-size="22" fill="#94a3b8">Kaynak: hal fiyat verisi</text>
  </svg>`;
}

function absolutize(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  const base = (env.PUBLIC_URL || "").replace(/\/+$/, "");
  return base ? `${base}${url.startsWith("/") ? "" : "/"}${url}` : url;
}

async function renderAndUpload(svg: string, publicId: string): Promise<string | null> {
  try {
    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    const cfg = await getCloudinaryConfig();
    if (!cfg) return null;
    const up = await uploadBufferAuto(cfg, png, { folder: "social", publicId, mime: "image/png" });
    return absolutize(up.secure_url);
  } catch {
    return null;
  }
}

/** Movers grafiğini üretip yükler; public URL döner (yoksa null). */
export async function buildMoversChartUrl(rows: ChartRow[], dateLabel: string, slug: string): Promise<string | null> {
  if (!rows.length) return null;
  return renderAndUpload(chartSvg("Günün Hal Hareketleri", dateLabel, rows), `movers-${slug}`);
}

/** Popüler ürün fiyat tablosu grafiğini üretip yükler. */
export async function buildStaplesChartUrl(rows: StapleRow[], dateLabel: string, slug: string): Promise<string | null> {
  if (!rows.length) return null;
  return renderAndUpload(staplesGridSvg("Popüler Ürün Fiyatları", dateLabel, rows), `staples-${slug}`);
}
