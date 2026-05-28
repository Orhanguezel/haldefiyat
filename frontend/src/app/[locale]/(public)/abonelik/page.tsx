export const dynamic = "force-dynamic";

import { Suspense } from "react";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import PageContainer from "@/components/layout/PageContainer";
import UnsubscribeClient from "@/components/sections/UnsubscribeClient";

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
      <Suspense fallback={null}>
        <UnsubscribeClient />
      </Suspense>
    </PageContainer>
  );
}
