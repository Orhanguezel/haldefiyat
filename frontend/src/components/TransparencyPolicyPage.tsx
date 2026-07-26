import { setRequestLocale } from "next-intl/server";
import { fetchCustomPageBySlug } from "@/lib/api";
import Breadcrumb from "@/components/seo/Breadcrumb";
import LegalPageContent from "@/components/LegalPageContent";

export default async function TransparencyPolicyPage({
  locale,
  slug,
  title,
}: {
  locale: string;
  slug: string;
  title: string;
}) {
  setRequestLocale(locale);
  const page = await fetchCustomPageBySlug(slug, locale);

  return (
    <>
      <div className="mx-auto max-w-350 px-8 pt-12">
        <Breadcrumb items={[
          { name: "Anasayfa", href: "/" },
          { name: title, href: `/${slug}` },
        ]} />
      </div>
      <LegalPageContent page={page} fallbackTitle={title} />
    </>
  );
}
