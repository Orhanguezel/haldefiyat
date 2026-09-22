import { renderPageOg } from "@/lib/og-page";

export const revalidate = 3600;
const API = process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8091";
type Props = { params: Promise<{ slug: string }> };

function label(slug: string) { return slug.split("-").map((v) => v.charAt(0).toLocaleUpperCase("tr-TR") + v.slice(1)).join(" "); }

export async function GET(_req: Request, { params }: Props) {
  const { slug } = await params;
  const city = label(slug);
  let total = 0;
  try {
    const res = await fetch(`${API}/api/v1/firms?city=${encodeURIComponent(slug)}&type=komisyoncu&limit=1`, { next: { revalidate: 3600 } });
    if (res.ok) total = Number((await res.json())?.meta?.total ?? 0);
  } catch {}
  return renderPageOg({ kicker: "Komisyoncu Rehberi", title: `${city} Hal Firmaları`, subtitle: "Firma, iletişim ve adres bilgileri", chips: total ? [`${total} aktif firma`] : [] });
}
