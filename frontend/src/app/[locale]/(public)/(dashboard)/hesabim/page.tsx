export const dynamic = "force-dynamic";

import { setRequestLocale } from "next-intl/server";
import { DashboardOverview } from "@/components/dashboard/overview/DashboardOverview";

type Props = { params: Promise<{ locale: string }> };

export default async function HesabimPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <DashboardOverview />;
}
