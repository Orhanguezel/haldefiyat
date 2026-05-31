import { NextResponse } from "next/server";

// IndexNow anahtar dosyasi: api.indexnow.org bu URL'in icerigini key ile karsilastirir.
// Anahtar env'den gelir (hardcode yok); yoksa 404 → IndexNow devre disi.
const KEY = (process.env.INDEXNOW_KEY ?? "").trim();

export const revalidate = 86400;

export function GET() {
  if (!KEY) return new NextResponse("", { status: 404 });
  return new NextResponse(KEY, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
