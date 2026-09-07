// Keep date-bearing data on the existing prices cache/revalidation path.
// BannerSlot still renders per request; force-dynamic had disabled every fetch cache.
export const revalidate = 300;

import DesktopHomePage from "@/components/home/DesktopHomePage";
import { getHomeMetadata } from "@/lib/home-page-data";
import { setRequestLocale } from "next-intl/server";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return getHomeMetadata((await params).locale);
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <DesktopHomePage locale={locale} />;
}
