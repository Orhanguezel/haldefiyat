export const dynamic = "force-dynamic";

import MobileHomePage from "@/components/home/MobileHomePage";
import { getHomeMetadata } from "@/lib/home-page-data";
import { setRequestLocale } from "next-intl/server";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return getHomeMetadata((await params).locale);
}

export default async function InternalMobileHomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <MobileHomePage locale={locale} />;
}
