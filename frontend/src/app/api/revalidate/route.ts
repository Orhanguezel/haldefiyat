import { revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * On-demand cache revalidation — backend içerik değiştirince (ör. admin hal künyesi
 * PATCH) bu route'u çağırır ve ilgili fetch tag'ini geçersiz kılar. Böylece elle
 * `.next/cache/fetch-cache` temizlemeye gerek kalmaz.
 *
 * Yetki: REVALIDATE_SECRET (backend ile paylaşımlı). Secret yoksa route kapalıdır.
 */
export async function POST(req: NextRequest) {
  const expected = process.env.REVALIDATE_SECRET;
  const provided =
    req.headers.get("x-revalidate-secret") ?? req.nextUrl.searchParams.get("secret");

  if (!expected || provided !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const tag = req.nextUrl.searchParams.get("tag") ?? "markets";
  // Next 16: revalidateTag(tag, profile) — "max" ile tag'li girdiler on-demand purge edilir.
  revalidateTag(tag, "max");
  return NextResponse.json({ revalidated: true, tag });
}
