export const dynamic = "force-dynamic";

import { Suspense } from "react";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import PageContainer from "@/components/layout/PageContainer";
import UnsubscribeClient from "@/components/sections/UnsubscribeClient";
import ApiProductNav from "@/components/api/ApiProductNav";

type Props = { params: Promise<{ locale: string }> };

export const metadata: Metadata = {
  title: "Abonelik | HaldeFiyat",
  description: "HaldeFiyat haftalık bülten abonelik yönetimi.",
  robots: { index: false, follow: false },
};

export default async function AbonelikPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <PageContainer>
      <ApiProductNav current="/abonelik" />
      <div className="mx-auto mb-4 max-w-md rounded-[8px] border border-(--color-border) bg-(--color-surface) p-4 text-sm leading-6 text-(--color-muted)">
        <strong className="text-(--color-foreground)">Bu sayfa haftalık bülten aboneliğini yönetir.</strong> API planı ve anahtar işlemleri için <a href="/pro" className="font-semibold text-(--color-brand) underline">API Pro</a> sayfasını kullanın.
      </div>
      <Suspense fallback={null}>
        <UnsubscribeClient />
      </Suspense>
    </PageContainer>
  );
}
