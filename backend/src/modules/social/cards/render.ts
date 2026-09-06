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
import type { BasketRow, CityCompare, MoverRow } from "./select";

const SITE_URL = "https://haldefiyat.com";
export type CardSize = "tg" | "ig" | "wide";

interface Geometry {
  width: number; height: number; pad: number; rowGap: number; maxRow: number; headerH: number; footerH: number;
  titleSize: number; nameSize: number; priceSize: number; metaSize: number; perSide: number; basketCols: number; basketRows: number;
}

const GEOMETRY: Record<CardSize, Geometry> = {
  tg:   { width: 1200, height: 1800, pad: 52, rowGap: 12, maxRow: 124, headerH: 166, footerH: 129, titleSize: 46, nameSize: 30, priceSize: 31, metaSize: 23, perSide: 5, basketCols: 2, basketRows: 5 },
  ig:   { width: 1080, height: 1350, pad: 44, rowGap: 12, maxRow: 118, headerH: 166, footerH: 120, titleSize: 42, nameSize: 28, priceSize: 29, metaSize: 21, perSide: 4, basketCols: 2, basketRows: 5 },
  wide: { width: 1200, height: 675,  pad: 36, rowGap: 8,  maxRow: 92,  headerH: 154, footerH: 78,  titleSize: 34, nameSize: 23, priceSize: 24, metaSize: 17, perSide: 2, basketCols: 2, basketRows: 3 },
};

/** Icerik alani: baslik seridi ile alt bant arasi. Satir yuksekligi buradan turetilir — sabit sayi tuvale sigmayabilir. */
function contentTop(g: Geometry): number { return g.pad + g.headerH; }
function contentBottom(g: Geometry): number { return g.height - g.pad - g.footerH - 52; }
function contentHeight(g: Geometry): number { return contentBottom(g) - contentTop(g); }

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
  const footerH = g.footerH;
  const footerY = contentBottom(g) + 18;
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
  const n = selected.length || 1;
  // Iki bolum basligi + n satir icerik alanini tam doldursun: alt bantla cakisma ve alt bosluk ikisi de olmaz.
  const rowH = Math.min(g.maxRow, Math.floor((contentHeight(g) - (n - 1) * g.rowGap) / (n + 0.55)));
  const thumb = rowH;
  const thumbs = await loadThumbs(selected, thumb);
  const sectionGap = Math.round(rowH * 0.55);
  const nameMax = size === "wide" ? 20 : 24;
  let y = contentTop(g);
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
      ? `<defs><clipPath id="${clipId}"><rect x="${g.pad}" y="${y}" width="${thumb}" height="${thumb}" rx="22"/></clipPath></defs><image href="${thumbs[index]}" x="${g.pad}" y="${y}" width="${thumb}" height="${thumb}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipId})"/>`
      : "";
    const textX = g.pad + thumb + 26;
    const rightX = g.width - g.pad;
    rows.push(`
      <rect x="${g.pad - 12}" y="${y - 8}" width="${g.width - (g.pad - 12) * 2}" height="${thumb + 16}" rx="24" fill="#f8fafc" stroke="#e2e8f0"/>
      ${photo}
      <text x="${textX}" y="${y + thumb * 0.4}" font-size="${g.nameSize}" font-weight="800" fill="#172033">${escapeXml(clip(item.productName, nameMax))}</text>
      <text x="${textX}" y="${y + thumb * 0.75}" font-size="${g.metaSize}" fill="#64748b">${escapeXml(item.cityName)} · ${item.marketsToday} hal</text>
      <text x="${rightX}" y="${y + thumb * 0.4}" text-anchor="end" font-size="${g.priceSize}" font-weight="800" fill="#0f172a">₺${escapeXml(fmtPrice(item.latest))}</text>
      <text x="${rightX}" y="${y + thumb * 0.76}" text-anchor="end" font-size="${g.metaSize + 2}" font-weight="800" fill="${color}">${dir > 0 ? "▲" : "▼"} %${fmtPctTr(item.changePct)}</text>`);
    y += rowH + g.rowGap;
  });

  const svg = frame(g, "Günün Hal Hareketleri", `${selected.length} ürün · TL/kg`, dateLabel, rows.join("\n"),
    "Tüm hal fiyatları, şehir karşılaştırması ve grafikler", "haldefiyat.com/fiyatlar");
  return sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
}

export async function renderBasketCard(items: BasketRow[], size: CardSize, dateLabel: string): Promise<Buffer> {
  const g = GEOMETRY[size];
  const max = g.basketCols * g.basketRows;
  const selected = items.slice(0, max);
  const rowCount = Math.max(1, Math.ceil(selected.length / g.basketCols));
  const cellH = Math.floor((contentHeight(g) - (rowCount - 1) * g.rowGap) / rowCount);
  const thumb = Math.min(Math.round(g.maxRow * 1.4), cellH - 32);
  const thumbs = await loadThumbs(selected, thumb);
  const colW = Math.round((g.width - g.pad * 2 - 24) / g.basketCols);
  const top = contentTop(g);
  const cells = selected.map((item, index) => {
    const col = index % g.basketCols;
    const row = Math.floor(index / g.basketCols);
    const x = g.pad + col * (colW + 24);
    const y = top + row * (cellH + g.rowGap);
    const dir = item.weekChangePct == null ? 0 : item.weekChangePct >= 0 ? 1 : -1;
    // K1 ile ayni okuma: yukari ok yesil, asagi ok kirmizi — iki kart yan yana gorulur.
    const color = dir > 0 ? "#16a34a" : dir < 0 ? "#dc2626" : "#64748b";
    const clipId = `b${index}`;
    const photoY = y + Math.round((cellH - thumb) / 2);
    const photo = thumbs[index]
      ? `<defs><clipPath id="${clipId}"><rect x="${x + 14}" y="${photoY}" width="${thumb}" height="${thumb}" rx="20"/></clipPath></defs><image href="${thumbs[index]}" x="${x + 14}" y="${photoY}" width="${thumb}" height="${thumb}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipId})"/>`
      : "";
    const textX = x + thumb + 30;
    return `
      <rect x="${x}" y="${y}" width="${colW}" height="${cellH}" rx="24" fill="#f8fafc" stroke="#e2e8f0"/>
      ${photo}
      <text x="${textX}" y="${y + cellH * 0.42}" font-size="${g.nameSize - 2}" font-weight="800" fill="#172033">${escapeXml(clip(item.productName, 18))}</text>
      <text x="${textX}" y="${y + cellH * 0.74}" font-size="${g.priceSize - 2}" font-weight="800" fill="#0f172a">₺${escapeXml(fmtPrice(item.price))}</text>
      <text x="${x + colW - 18}" y="${y + cellH * 0.74}" text-anchor="end" font-size="${g.metaSize}" font-weight="800" fill="${color}">${item.weekChangePct == null ? "—" : `${dir > 0 ? "▲" : dir < 0 ? "▼" : ""} %${fmtPctTr(item.weekChangePct)}`}</text>`;
  }).join("\n");

  const svg = frame(g, "Mutfak Sepeti", "haftalık değişim · TL/kg", dateLabel, cells,
    "Bugünün tüm hal fiyatları ve şehir karşılaştırması", "haldefiyat.com/fiyatlar");
  return sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
}


/**
 * K3 — sehir sehir hal: tek urun, sehirlere gore fiyat ve ulusal medyandan sapma.
 * Satirlarda urun fotografi tekrar etmez; tek buyuk gorsel baslikta durur.
 */
export async function renderCityCard(data: CityCompare, size: CardSize, dateLabel: string): Promise<Buffer> {
  const g = GEOMETRY[size];
  const n = data.rows.length || 1;
  const rowH = Math.min(g.maxRow, Math.floor((contentHeight(g) - 96 - (n - 1) * g.rowGap) / n));
  const thumbs = await loadThumbs([{ productSlug: data.productSlug, imageUrl: data.imageUrl, canonicalSlug: null }], Math.round(rowH * 1.6));
  const hero = thumbs[0];
  const heroSize = Math.round(rowH * 1.6);

  let y = contentTop(g) + 96;
  const parts: string[] = [];

  const headline = `${data.productName} · ₺${fmtPrice(data.national)}/kg`;
  parts.push(`<text x="${g.pad + (hero ? heroSize + 24 : 0)}" y="${contentTop(g) + 34}" font-size="${g.nameSize + 6}" font-weight="800" fill="#172033">${escapeXml(clip(headline, 30))}</text>`);
  parts.push(`<text x="${g.pad + (hero ? heroSize + 24 : 0)}" y="${contentTop(g) + 70}" font-size="${g.metaSize + 1}" fill="#64748b">Ülke medyanı · ${data.rows.length} şehir karşılaştırması</text>`);
  if (hero) {
    parts.push(`<defs><clipPath id="hero"><rect x="${g.pad}" y="${contentTop(g) - 26}" width="${heroSize}" height="${heroSize}" rx="24"/></clipPath></defs>`
      + `<image href="${hero}" x="${g.pad}" y="${contentTop(g) - 26}" width="${heroSize}" height="${heroSize}" preserveAspectRatio="xMidYMid slice" clip-path="url(#hero)"/>`);
    y = Math.max(y, contentTop(g) - 26 + heroSize + 20);
  }

  data.rows.forEach((row) => {
    const dir = row.diffPct == null ? 0 : row.diffPct > 1 ? 1 : row.diffPct < -1 ? -1 : 0;
    // Ucuz sehir yesil, pahali sehir kirmizi: okur "nerede ucuz" diye bakar.
    const color = dir > 0 ? "#dc2626" : dir < 0 ? "#16a34a" : "#64748b";
    const rightX = g.width - g.pad;
    parts.push(`
      <rect x="${g.pad - 12}" y="${y}" width="${g.width - (g.pad - 12) * 2}" height="${rowH}" rx="20" fill="#f8fafc" stroke="#e2e8f0"/>
      <text x="${g.pad + 14}" y="${y + rowH * 0.62}" font-size="${g.nameSize}" font-weight="800" fill="#172033">${escapeXml(clip(row.cityName, 18))}</text>
      <text x="${rightX - 150}" y="${y + rowH * 0.62}" text-anchor="end" font-size="${g.priceSize}" font-weight="800" fill="#0f172a">₺${escapeXml(fmtPrice(row.price))}</text>
      <text x="${rightX}" y="${y + rowH * 0.62}" text-anchor="end" font-size="${g.metaSize + 2}" font-weight="800" fill="${color}">${row.diffPct == null ? "—" : `${row.diffPct > 0 ? "+" : "−"}%${fmtPctTr(row.diffPct)}`}</text>`);
    y += rowH + g.rowGap;
  });

  const svg = frame(g, "Şehir Şehir Hal", `${data.productName} · TL/kg`, dateLabel, parts.join("\n"),
    "Kendi şehrinin hal fiyatını karşılaştır", "haldefiyat.com/fiyatlar");
  return sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
}

/** Karti depoya yukler; ayni gun ayni seri+boyut icin ayni public id (tekrar uretim uzerine yazar). */
export async function uploadCard(png: Buffer, publicId: string): Promise<string | null> {
  const config = await getCloudinaryConfig();
  if (!config) return null;
  const uploaded = await uploadBufferAuto(config, png, { folder: "social-cards", publicId, mime: "image/png" });
  return absoluteUrl(uploaded.secure_url);
}
