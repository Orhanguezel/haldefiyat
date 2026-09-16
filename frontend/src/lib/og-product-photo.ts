import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getProductImage } from "@/lib/product-images";

/**
 * Urunun kendi fotografini OG kapagi icin data URI olarak verir
 * (public/images/urunler, 536 urunluk manifest). Satori uzak URL yerine data
 * URI ile guvenilir calisir. Fotograf yoksa null — kapak marka zeminiyle kurulur.
 *
 * Neden ortak: /og/urun kapagi fotografi tasiyordu, /og/fiyat tasimiyordu;
 * Google AI Modu "domates fiyatlari" icin /fiyat/trabzon/domates'i gosterdi ve
 * kare kirpimda kapagin sol ustundeki logo ("defiy") cikti, domates degil
 * (17 Eyl 2026 ekran goruntusu). Iki rota ayni yukleyiciyi kullanir.
 */
export async function loadProductPhoto(slug: string, canonicalSlug?: string | null): Promise<string | null> {
  const path = getProductImage(slug, canonicalSlug ?? undefined);
  if (!path) return null;
  try {
    const data = await readFile(join(process.cwd(), "public", path.replace(/^\//, "")));
    const mime = /\.png$/i.test(path) ? "image/png" : /\.webp$/i.test(path) ? "image/webp" : "image/jpeg";
    return `data:${mime};base64,${data.toString("base64")}`;
  } catch {
    return null;
  }
}
