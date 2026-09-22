import { renderPageOg } from "@/lib/og-page";

export const revalidate = 3600;
const API = process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8091";
type Props = { params: Promise<{ slug: string }> };
const TYPES: Record<string, string> = { komisyoncu: "Hal Komisyoncusu", soguk_hava: "Soğuk Hava Deposu", nakliye: "Nakliye Firması", zirai_ilac: "Zirai İlaç Firması" };
function label(slug?: string | null) { return (slug ?? "Türkiye").split("-").map((v) => v.charAt(0).toLocaleUpperCase("tr-TR") + v.slice(1)).join(" "); }

export async function GET(_req: Request, { params }: Props) {
  const { slug } = await params;
  let firm: { name?: string; citySlug?: string | null; districtSlug?: string | null; firmType?: string } | null = null;
  try { const res = await fetch(`${API}/api/v1/firms/${encodeURIComponent(slug)}`, { next: { revalidate: 3600 } }); if (res.ok) firm = (await res.json())?.item ?? null; } catch {}
  return renderPageOg({ kicker: TYPES[firm?.firmType ?? ""] ?? "Firma Profili", title: firm?.name ?? label(slug), subtitle: [label(firm?.districtSlug), label(firm?.citySlug)].filter((v, i, a) => v !== "Türkiye" && a.indexOf(v) === i).join(" · ") || "Türkiye Hal Firma Rehberi" });
}
