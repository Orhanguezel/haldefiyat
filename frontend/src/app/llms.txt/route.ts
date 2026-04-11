import { NextResponse } from "next/server";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3033").replace(/\/$/, "");
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "HalDeFiyat";

export const revalidate = 3600;

export async function GET() {
  const lines = [
    `# ${SITE_NAME}`,
    `> ${SITE_NAME}, Turkiye'deki hallerin gunluk sebze ve meyve fiyatlarini takip etmeye yarayan bagimsiz bir platformdur.`,
    "",
    `## Ana Sayfalar`,
    `- [Anasayfa](${SITE_URL}/)`,
    `- [Hal Fiyatlari](${SITE_URL}/fiyatlar): Tum urunlerin gunluk fiyatlari`,
    `- [Karsilastir](${SITE_URL}/karsilastirma): Urun/hal bazli fiyat karsilastirma`,
    `- [Hakkimizda](${SITE_URL}/hakkimizda)`,
    `- [Iletisim](${SITE_URL}/iletisim)`,
  ];

  return new NextResponse(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=3600" },
  });
}
