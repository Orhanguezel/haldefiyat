import { env } from "@/core/env";

/**
 * Frontend fetch-cache'ini on-demand geçersiz kılar. Admin bir hal/künye kaydedince
 * çağrılır; frontend'in `markets` tag'li fetch'leri anında tazelenir (elle
 * `.next/cache/fetch-cache` temizlemeye gerek kalmaz).
 *
 * Fire-and-forget: revalidate başarısız olsa da asıl işlem (kaydetme) etkilenmez;
 * en kötü ihtimalle veri `revalidate` süresi (5 dk) sonra kendiliğinden tazelenir.
 * Backend, frontend'e nginx'i baypas ederek doğrudan (FRONTEND_URL = 127.0.0.1:3033)
 * ulaşır — dış dünyaya açık bir revalidate ucu oluşmaz.
 */
export async function revalidateFrontendTag(tag: string): Promise<void> {
  const secret = env.REVALIDATE_SECRET;
  // nginx `/api/*` isteklerini BACKEND'e yonlendiriyor; public adres uzerinden
  // cagirinca istek frontend'e hic ulasmiyor ve 404 doner. Cagri hatayi sessizce
  // yuttugu icin bu FARK EDILMEDEN calisiyordu — fiyat, karantina ve urun
  // guncellemelerinin hicbiri onbellegi dusuremiyordu (2026-09-02).
  //
  // FRONTEND_URL public kalmali (odeme donus adresi, OAuth yonlendirmesi onu
  // kullaniyor); revalidate icin AYRI bir ic adres var.
  const base = (env.FRONTEND_INTERNAL_URL || env.FRONTEND_URL || "").replace(/\/$/, "");
  if (!secret || !base) return;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    await fetch(`${base}/api/revalidate?tag=${encodeURIComponent(tag)}`, {
      method: "POST",
      headers: { "x-revalidate-secret": secret },
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));
  } catch {
    // sessizce yut — süre dolunca zaten tazelenir
  }
}
