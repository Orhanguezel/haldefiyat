/**
 * Sosyal kart cizimi — tek sablon ailesi, uc boyut.
 *
 * Telegram'daki fotografli dikey kart begenildi; ayni tasarim Instagram (4:5) ve
 * genis (16:9) boyutlarinda da uretilir. Onceki durumda Instagram'a 16:9 grafik
 * 4:5 tuvale "contain" ile basiliyor, ust/alt %45 siyah bant kaliyordu.
 *
 * Alt bant (adres seridi) suslemek icin degil: gorsel WhatsApp'ta ileri iletilince
 * altyazi tasinmaz — adres gorselin icinde durursa gorsel nereye giderse gitsin
 * siteyi soyler.
 */
import sharp from "sharp";
import { getCloudinaryConfig, uploadBufferAuto } from "@agro/shared-backend/modules/storage";
import type { BasketRow, MoverRow } from "./select";

const SITE_URL = "https://haldefiyat.com";
export type CardSize = "tg" | "ig" | "wide";

interface Geometry {
  width: number; height: number; pad: number; rowH: number; rowGap: number; thumb: number;
  titleSize: number; nameSize: number; priceSize: number; metaSize: number; perSide: number; basketCols: number; basketRows: number;
}

const GEOMETRY: Record<CardSize, Geometry> = {
  tg:   { width: 1200, height: 1800, pad: 52, rowH: 112, rowGap: 12, thumb: 112, titleSize: 46, nameSize: 30, priceSize: 31, metaSize: 23, perSide: 5, basketCols: 2, basketRows: 5 },
  ig:   { width: 1080, height: 1350, pad: 44, rowH: 96,  rowGap: 10, thumb: 96,  titleSize: 42, nameSize: 28, priceSize: 29, metaSize: 21, perSide: 3, basketCols: 2, basketRows: 4 },
  wide: { width: 1200, height: 675,  pad: 40, rowH: 74,  rowGap: 8,  thumb: 74,  titleSize: 36, nameSize: 24, priceSize: 25, metaSize: 18, perSide: 3, basketCols: 2, basketRows: 3 },
};

type Manifest = Record<string, string>;

const escapeXml = (v: string) => v.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);
const fmtPrice = (v: number) => v.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtPctTr = (v: number) => Math.abs(v).toLocaleString("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const clip = (v: string, max: number) => (v.length > max ? `${v.slice(0, max - 1)}…` : v);
const absoluteUrl = (p: string) => (/^https?:\/\//i.test(p) ? p : `${SITE_URL}${p.startsWith("/") ? "" : "/"}${p}`);

function manifestImage(manifest: Manifest, slug: string, canonicalSlug?: string | null): string | null {
  for (const candidate of [slug, canonicalSlug].filter((v): v is string => Boolean(v))) {
    if (manifest[candidate]) return manifest[candidate];
    const parts = candidate.split("-");
    for (let i = parts.length - 1; i >= 1; i--) {
      const prefix = parts.slice(0, i).join("-");
      if (manifest[prefix]) return manifest[prefix];
    }
  }
  return null;
}

async function loadManifest(): Promise<Manifest> {
  const res = await fetch(`${SITE_URL}/images/urunler/manifest.json`, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`urun manifest HTTP ${res.status}`);
  return res.json() as Promise<Manifest>;
}

async function thumbnailDataUrl(url: string, size: number): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(12_000) });
    if (!res.ok) return null;
    const png = await sharp(Buffer.from(await res.arrayBuffer()))
      .resize(size, size, { fit: "cover", position: "centre" }).png({ compressionLevel: 9 }).toBuffer();
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch {
    return null;
  }
}

type Thumbable = { productSlug: string; canonicalSlug: string | null; imageUrl: string | null };

async function loadThumbs(items: Thumbable[], size: number): Promise<(string | null)[]> {
  let manifest: Manifest = {};
  try { manifest = await loadManifest(); } catch { /* manifest yoksa kart fotografsiz cizilir */ }
  return Promise.all(items.map(async (item) => {
    const explicit = item.imageUrl?.trim();
    const path = explicit || manifestImage(manifest, item.productSlug, item.canonicalSlug);
    return path ? thumbnailDataUrl(absoluteUrl(path), size) : null;
  }));
}

function frame(g: Geometry, title: string, subtitle: string, dateLabel: string, body: string, footerTop: string, footerBottom: string): string {
  const inner = g.width - g.pad * 2;
  const footerH = Math.round(g.rowH * 1.15);
  const footerY = g.height - g.pad - footerH - 34;
  return `<svg width="${g.width}" height="${g.height}" viewBox="0 0 ${g.width} ${g.height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${g.width}" height="${g.height}" fill="#edf4ef"/>
    <rect x="${g.pad - 24}" y="${g.pad - 24}" width="${inner + 48}" height="${g.height - (g.pad - 24) * 2}" rx="34" fill="#ffffff" stroke="#d8e5dc"/>
    <text x="${g.pad}" y="${g.pad + 46}" font-size="${g.titleSize}" font-weight="900" fill="#153d2c">HaldeFiyat</text>
    <text x="${g.pad}" y="${g.pad + 94}" font-size="${Math.round(g.titleSize * 0.68)}" font-weight="700" fill="#172033">${escapeXml(title)}</text>
    <text x="${g.width - g.pad}" y="${g.pad + 66}" text-anchor="end" font-size="${g.metaSize + 2}" fill="#64748b">${escapeXml(dateLabel)}</text>
    <text x="${g.width - g.pad}" y="${g.pad + 96}" text-anchor="end" font-size="${g.metaSize}" fill="#94a3b8">${escapeXml(subtitle)}</text>
    <line x1="${g.pad}" y1="${g.pad + 120}" x2="${g.width - g.pad}" y2="${g.pad + 120}" stroke="#dbe7df" stroke-width="2"/>
    ${body}
    <rect x="${g.pad - 12}" y="${footerY}" width="${inner + 24}" height="${footerH}" rx="26" fill="#15803d"/>
    <text x="${g.width / 2}" y="${footerY + footerH * 0.38}" text-anchor="middle" font-size="${g.metaSize + 3}" font-weight="700" fill="#cfe9d9">${escapeXml(footerTop)}</text>
    <text x="${g.width / 2}" y="${footerY + footerH * 0.78}" text-anchor="middle" font-size="${Math.round(g.titleSize * 0.86)}" font-weight="900" fill="#ffffff">${escapeXml(footerBottom)}</text>
    <text x="${g.pad}" y="${g.height - 34}" font-size="${g.metaSize + 2}" font-weight="900" fill="#16834b">HaldeFiyat</text>
    <text x="${g.width - g.pad}" y="${g.height - 34}" text-anchor="end" font-size="${g.metaSize - 2}" fill="#94a3b8">Belediye halleri + HKS · Günlük güncellenir</text>
  </svg>`;
}

export async function renderMoversCard(
  risers: MoverRow[], fallers: MoverRow[], size: CardSize, dateLabel: string,
): Promise<Buffer> {
  const g = GEOMETRY[size];
  const selected = [...risers.slice(0, g.perSide), ...fallers.slice(0, g.perSide)];
  const thumbs = await loadThumbs(selected, g.thumb);
  const sectionGap = Math.round(g.rowH * 0.55);
  const nameMax = size === "wide" ? 20 : 24;
  let y = g.pad + 166;
  const rows: string[] = [];
  let prevDir = 0;

  selected.forEach((item, index) => {
    const dir = item.changePct >= 0 ? 1 : -1;
    if (dir !== prevDir) {
      if (prevDir !== 0) y += sectionGap;
      rows.push(`<text x="${g.pad}" y="${y - 18}" font-size="${g.metaSize + 4}" font-weight="800" fill="${dir > 0 ? "#15803d" : "#b91c1c"}">${dir > 0 ? "EN ÇOK ARTANLAR" : "EN ÇOK DÜŞENLER"}</text>`);
      prevDir = dir;
    }
    const color = dir > 0 ? "#16a34a" : "#dc2626";
    const clipId = `p${index}`;
    const photo = thumbs[index]
      ? `<defs><clipPath id="${clipId}"><rect x="${g.pad}" y="${y}" width="${g.thumb}" height="${g.thumb}" rx="22"/></clipPath></defs><image href="${thumbs[index]}" x="${g.pad}" y="${y}" width="${g.thumb}" height="${g.thumb}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipId})"/>`
      : "";
    const textX = g.pad + g.thumb + 26;
    const rightX = g.width - g.pad;
    rows.push(`
      <rect x="${g.pad - 12}" y="${y - 8}" width="${g.width - (g.pad - 12) * 2}" height="${g.thumb + 16}" rx="24" fill="#f8fafc" stroke="#e2e8f0"/>
      ${photo}
      <text x="${textX}" y="${y + g.thumb * 0.4}" font-size="${g.nameSize}" font-weight="800" fill="#172033">${escapeXml(clip(item.productName, nameMax))}</text>
      <text x="${textX}" y="${y + g.thumb * 0.75}" font-size="${g.metaSize}" fill="#64748b">${escapeXml(item.cityName)} · ${item.marketsToday} hal</text>
      <text x="${rightX}" y="${y + g.thumb * 0.4}" text-anchor="end" font-size="${g.priceSize}" font-weight="800" fill="#0f172a">₺${escapeXml(fmtPrice(item.latest))}</text>
      <text x="${rightX}" y="${y + g.thumb * 0.76}" text-anchor="end" font-size="${g.metaSize + 2}" font-weight="800" fill="${color}">${dir > 0 ? "▲" : "▼"} %${fmtPctTr(item.changePct)}</text>`);
    y += g.rowH + g.rowGap;
  });

  const svg = frame(g, "Günün Hal Hareketleri", `${selected.length} ürün · TL/kg`, dateLabel, rows.join("\n"),
    "Tüm hal fiyatları, şehir karşılaştırması ve grafikler", "haldefiyat.com/fiyatlar");
  return sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
}

export async function renderBasketCard(items: BasketRow[], size: CardSize, dateLabel: string): Promise<Buffer> {
  const g = GEOMETRY[size];
  const max = g.basketCols * g.basketRows;
  const selected = items.slice(0, max);
  const thumbs = await loadThumbs(selected, g.thumb);
  const colW = Math.round((g.width - g.pad * 2 - 24) / g.basketCols);
  const cellH = g.thumb + 24;
  const top = g.pad + 166;
  const cells = selected.map((item, index) => {
    const col = index % g.basketCols;
    const row = Math.floor(index / g.basketCols);
    const x = g.pad + col * (colW + 24);
    const y = top + row * (cellH + g.rowGap);
    const dir = item.weekChangePct == null ? 0 : item.weekChangePct >= 0 ? 1 : -1;
    const color = dir > 0 ? "#dc2626" : dir < 0 ? "#16a34a" : "#64748b";
    const clipId = `b${index}`;
    const photo = thumbs[index]
      ? `<defs><clipPath id="${clipId}"><rect x="${x + 12}" y="${y + 12}" width="${g.thumb - 8}" height="${g.thumb - 8}" rx="20"/></clipPath></defs><image href="${thumbs[index]}" x="${x + 12}" y="${y + 12}" width="${g.thumb - 8}" height="${g.thumb - 8}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipId})"/>`
      : "";
    const textX = x + g.thumb + 16;
    return `
      <rect x="${x}" y="${y}" width="${colW}" height="${cellH}" rx="24" fill="#f8fafc" stroke="#e2e8f0"/>
      ${photo}
      <text x="${textX}" y="${y + cellH * 0.42}" font-size="${g.nameSize - 2}" font-weight="800" fill="#172033">${escapeXml(clip(item.productName, 15))}</text>
      <text x="${textX}" y="${y + cellH * 0.74}" font-size="${g.priceSize - 2}" font-weight="800" fill="#0f172a">₺${escapeXml(fmtPrice(item.price))}</text>
      <text x="${x + colW - 18}" y="${y + cellH * 0.74}" text-anchor="end" font-size="${g.metaSize}" font-weight="800" fill="${color}">${item.weekChangePct == null ? "—" : `${dir > 0 ? "▲" : dir < 0 ? "▼" : ""} %${fmtPctTr(item.weekChangePct)}`}</text>`;
  }).join("\n");

  const svg = frame(g, "Mutfak Sepeti", "haftalık değişim · TL/kg", dateLabel, cells,
    "Bugünün tüm hal fiyatları ve şehir karşılaştırması", "haldefiyat.com/fiyatlar");
  return sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
}

/** Karti depoya yukler; ayni gun ayni seri+boyut icin ayni public id (tekrar uretim uzerine yazar). */
export async function uploadCard(png: Buffer, publicId: string): Promise<string | null> {
  const config = await getCloudinaryConfig();
  if (!config) return null;
  const uploaded = await uploadBufferAuto(config, png, { folder: "social-cards", publicId, mime: "image/png" });
  return absoluteUrl(uploaded.secure_url);
}
