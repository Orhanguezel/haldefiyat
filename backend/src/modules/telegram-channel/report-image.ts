import sharp from "sharp";
import { getCloudinaryConfig, uploadBufferAuto } from "@agro/shared-backend/modules/storage";

const SITE_URL = "https://haldefiyat.com";
const WIDTH = 1200;
const HEIGHT = 1800;

type ReportItem = {
  latest: number;
  changePct: number;
  product?: {
    slug?: string;
    nameTr?: string;
    displayName?: string | null;
    imageUrl?: string | null;
    canonicalSlug?: string | null;
  } | null;
  market?: { cityName?: string } | null;
};

type Manifest = Record<string, string>;

function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, (char) => ({
    "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;",
  })[char]!);
}

function fmtPrice(value: number): string {
  return value.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function clip(value: string, max = 26): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

function manifestImage(manifest: Manifest, slug: string, canonicalSlug?: string | null): string | null {
  for (const candidate of [slug, canonicalSlug].filter((value): value is string => Boolean(value))) {
    if (manifest[candidate]) return manifest[candidate]!;
    const parts = candidate.split("-");
    for (let i = parts.length - 1; i >= 1; i--) {
      const prefix = parts.slice(0, i).join("-");
      if (manifest[prefix]) return manifest[prefix]!;
    }
  }
  return null;
}

async function loadManifest(): Promise<Manifest> {
  const response = await fetch(`${SITE_URL}/images/urunler/manifest.json`, {
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`urun manifest HTTP ${response.status}`);
  return response.json() as Promise<Manifest>;
}

async function thumbnailDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(12_000) });
    if (!response.ok) return null;
    const input = Buffer.from(await response.arrayBuffer());
    const png = await sharp(input)
      .resize(112, 112, { fit: "cover", position: "centre" })
      .png({ compressionLevel: 9 })
      .toBuffer();
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch {
    return null;
  }
}

function imageFor(item: ReportItem, manifest: Manifest): string | null {
  const explicit = item.product?.imageUrl?.trim();
  if (explicit) return absoluteUrl(explicit);
  const slug = item.product?.slug ?? "";
  if (!slug) return null;
  const path = manifestImage(manifest, slug, item.product?.canonicalSlug);
  return path ? absoluteUrl(path) : null;
}

/**
 * Günlük rapor için gerçek ürün fotoğraflı dikey Telegram/WhatsApp kartı üretir.
 *
 * Alt bant (adres seridi) suslemek icin degil: gorsel WhatsApp'ta paylasildiginda
 * ve oradan ileriye iletildiginde altyazi tasinmaz — link kaybolur. Adres
 * gorselin kendisinde durursa gorsel nereye giderse gitsin siteyi soyler.
 */
export async function buildDailyReportImageUrl(
  items: ReportItem[],
  dateLabel: string,
  dateSlug: string,
): Promise<string | null> {
  try {
    const manifest = await loadManifest();
    const selected = [
      ...items.filter((item) => item.changePct > 0).slice(0, 5),
      ...items.filter((item) => item.changePct < 0).slice(0, 5),
    ];
    if (!selected.length) return null;

    const thumbs = await Promise.all(selected.map(async (item) => {
      const url = imageFor(item, manifest);
      return url ? thumbnailDataUrl(url) : null;
    }));

    const rowHeight = 112;
    const rowGap = 12;
    const sectionGap = 62;
    let y = 218;
    const rows: string[] = [];
    let previousDirection = 0;

    selected.forEach((item, index) => {
      const direction = item.changePct >= 0 ? 1 : -1;
      if (direction !== previousDirection) {
        if (previousDirection !== 0) y += sectionGap;
        rows.push(`<text x="64" y="${y - 20}" font-size="27" font-weight="800" fill="${direction > 0 ? "#15803d" : "#b91c1c"}">${direction > 0 ? "EN ÇOK ARTANLAR" : "EN ÇOK DÜŞENLER"}</text>`);
        previousDirection = direction;
      }

      const name = item.product?.displayName || item.product?.nameTr || "—";
      const city = item.market?.cityName ?? "";
      const color = direction > 0 ? "#16a34a" : "#dc2626";
      const arrow = direction > 0 ? "▲" : "▼";
      const clipId = `photo-${index}`;
      const photo = thumbs[index]
        ? `<defs><clipPath id="${clipId}"><rect x="64" y="${y}" width="112" height="112" rx="22"/></clipPath></defs><image href="${thumbs[index]}" x="64" y="${y}" width="112" height="112" preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipId})"/>`
        : "";

      rows.push(`
        <rect x="52" y="${y - 8}" width="1096" height="128" rx="24" fill="#f8fafc" stroke="#e2e8f0"/>
        ${photo}
        <text x="202" y="${y + 43}" font-size="30" font-weight="800" fill="#172033">${escapeXml(clip(name))}</text>
        <text x="202" y="${y + 82}" font-size="23" fill="#64748b">${escapeXml(city)}</text>
        <text x="1118" y="${y + 43}" text-anchor="end" font-size="31" font-weight="800" fill="#0f172a">₺${escapeXml(fmtPrice(item.latest))}</text>
        <text x="1118" y="${y + 83}" text-anchor="end" font-size="25" font-weight="800" fill="${color}">${arrow} %${Math.abs(item.changePct).toFixed(1)}</text>
      `);
      y += rowHeight + rowGap;
    });

    const svg = `<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${WIDTH}" height="${HEIGHT}" fill="#edf4ef"/>
      <rect x="28" y="28" width="1144" height="1744" rx="34" fill="#ffffff" stroke="#d8e5dc"/>
      <text x="64" y="98" font-size="46" font-weight="900" fill="#153d2c">HaldeFiyat</text>
      <text x="64" y="146" font-size="31" font-weight="700" fill="#172033">Günlük Fiyat Raporu</text>
      <text x="1136" y="118" text-anchor="end" font-size="25" fill="#64748b">${escapeXml(dateLabel)}</text>
      <line x1="64" y1="172" x2="1136" y2="172" stroke="#dbe7df" stroke-width="2"/>
      ${rows.join("\n")}
      <rect x="52" y="1556" width="1096" height="136" rx="26" fill="#15803d"/>
      <text x="600" y="1610" text-anchor="middle" font-size="26" font-weight="700" fill="#cfe9d9">Tüm hal fiyatları, şehir karşılaştırması ve grafikler</text>
      <text x="600" y="1662" text-anchor="middle" font-size="42" font-weight="900" fill="#ffffff">haldefiyat.com/fiyatlar</text>
      <text x="64" y="1738" font-size="25" font-weight="900" fill="#16834b">HaldeFiyat</text>
      <text x="1136" y="1738" text-anchor="end" font-size="21" fill="#94a3b8">Resmî hal verileri · Günlük güncellenir</text>
    </svg>`;

    const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
    const config = await getCloudinaryConfig();
    if (!config) return null;
    const uploaded = await uploadBufferAuto(config, png, {
      folder: "telegram-reports",
      publicId: `daily-${dateSlug}`,
      mime: "image/png",
    });
    return absoluteUrl(uploaded.secure_url);
  } catch (error) {
    console.warn("[daily-report-image] görsel üretilemedi", error);
    return null;
  }
}
