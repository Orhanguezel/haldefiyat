export const dynamic = "force-dynamic";

import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { fetchCustomPageBySlug } from "@/lib/api";
import LegalPageContent from "@/components/LegalPageContent";
import { getPageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return getPageMetadata("kullanim_kosullari", {
    locale,
    pathname: "/kullanim-kosullari",
    title: "Kullanım Koşulları | HaldeFiyat",
    description: "HaldeFiyat kullanım koşulları ve platform kullanımına ilişkin kurallar.",
  });
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const page = await fetchCustomPageBySlug("kullanim-kosullari", locale);

  return (
    <>
      <LegalPageContent page={page} fallbackTitle="Kullanım Koşulları" />
      <section className="mx-auto -mt-8 mb-12 max-w-4xl px-6">
        <div className="rounded-[10px] border border-(--color-border) bg-(--color-surface) p-5 text-sm leading-6 text-(--color-muted)">
          HalDeFiyat veri erişiminde HTML scraping yerine açık JSON API kullanımını destekler. API serbest, yüksek hacimli kullanım adil limitlere tabidir; detaylar için{" "}
          <Link href="/api-policy" className="font-semibold text-(--color-brand) hover:underline">
            API Kullanım Politikası
          </Link>
          {" "}sayfasını inceleyin.
        </div>
      </section>
    </>
  );
}
