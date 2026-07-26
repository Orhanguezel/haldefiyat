import { getPageMetadata } from "@/lib/seo";
import TransparencyPolicyPage from "@/components/TransparencyPolicyPage";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return getPageMetadata("sahiplik_finansman", {
    locale,
    pathname: "/sahiplik-finansman",
    title: "Sahiplik ve Finansman | HalDeFiyat",
    description: "HalDeFiyat platformunun sahiplik yapısı, finansman modeli ve editoryal bağımsızlık açıklaması.",
  });
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  return <TransparencyPolicyPage locale={locale} slug="sahiplik-finansman" title="Sahiplik ve Finansman" />;
}
