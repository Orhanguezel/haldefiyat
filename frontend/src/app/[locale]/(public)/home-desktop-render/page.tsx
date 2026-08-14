export const dynamic = "force-dynamic";

import DesktopHomePage from "@/components/home/DesktopHomePage";
import { getHomeMetadata } from "@/lib/home-page-data";
import { setRequestLocale } from "next-intl/server";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return getHomeMetadata((await params).locale);
}

export default async function InternalDesktopHomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <DesktopHomePage locale={locale} />;
}
