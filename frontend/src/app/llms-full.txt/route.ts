import { NextResponse } from "next/server";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3033").replace(/\/$/, "");
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "HalDeFiyat";

export const revalidate = 3600;

export async function GET() {
  const lines = [
    `# ${SITE_NAME} — Detayli Platform Bilgisi`,
    "",
    `> ${SITE_NAME}, Turkiye genelindeki sebze ve meyve hallerinden gunluk fiyat verisi toplayan bagimsiz bir fiyat takip platformudur.`,
    "",
    `## Hizmetler`,
    `- Gunluk hal fiyatlari (sebze/meyve)`,
    `- Sehir/hal bazli fiyat karsilastirma`,
    `- Urun bazli fiyat gecmisi ve trend analizi`,
    `- Fiyat alarmlari (yakinda)`,
    "",
    `## Sayfa Linkleri`,
    `- Anasayfa: ${SITE_URL}/`,
    `- Hal Fiyatlari: ${SITE_URL}/fiyatlar`,
    `- Karsilastir: ${SITE_URL}/karsilastirma`,
    `- Hakkimizda: ${SITE_URL}/hakkimizda`,
    `- Iletisim: ${SITE_URL}/iletisim`,
    "",
    `## Anahtar Kelimeler`,
    `hal fiyatlari, sebze fiyatlari, meyve fiyatlari, gunluk hal, Istanbul hal, Antalya hal, toptan fiyat, urun fiyati, Turkiye hal fiyat`,
  ];

  return new NextResponse(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=3600" },
  });
}
