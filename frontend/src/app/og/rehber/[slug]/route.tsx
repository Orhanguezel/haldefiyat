import { REHBER_PAGES } from "@/lib/rehber";
import { renderPageOg } from "@/lib/og-page";

export const revalidate = 3600;
type Props = { params: Promise<{ slug: string }> };
export async function GET(_req: Request, { params }: Props) {
  const { slug } = await params; const page = REHBER_PAGES[slug];
  return renderPageOg({ kicker: "Veriye Dayalı Alım Rehberi", title: page?.h1 ?? slug.replaceAll("-", " "), subtitle: page?.tagline ?? "Güncel fiyat ve mevsimsellik", chips: page ? [page.seasonWindow, `${page.basket.length} ürün`] : [] });
}
