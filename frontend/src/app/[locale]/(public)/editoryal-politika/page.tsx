import { getPageMetadata } from "@/lib/seo";
import TransparencyPolicyPage from "@/components/TransparencyPolicyPage";
import { sectionOgImage } from "@/lib/og-sections";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return getPageMetadata("editoryal_politika", {
    locale,
    pathname: "/editoryal-politika",
    openGraph: { images: [sectionOgImage("editoryal-politika")] },
    title: "Editoryal Politika | HalDeFiyat",
    description: "HalDeFiyat içerik üretimi, editoryal inceleme ve yayın standartları.",
  });
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  return <TransparencyPolicyPage locale={locale} slug="editoryal-politika" title="Editoryal Politika" />;
}
