import { PIYASA_PAGES } from "@/lib/piyasa";
import { renderPageOg } from "@/lib/og-page";

export const revalidate = 3600;
type Props = { params: Promise<{ slug: string }> };
export async function GET(_req: Request, { params }: Props) {
  const { slug } = await params; const page = PIYASA_PAGES[slug];
  return renderPageOg({ kicker: "Piyasa Kapsamı", title: page?.h1 ?? slug.replaceAll("-", " "), subtitle: page ? `${page.region} · Yerel ve ulusal kaynak durumu` : "Kaynak ve fiyat kapsamı", chips: page ? [page.productName, page.region] : [] });
}
