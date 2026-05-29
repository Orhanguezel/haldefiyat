export const dynamic = "force-dynamic";

import { setRequestLocale } from "next-intl/server";
import { FirmOwnerForm } from "@/components/firms/owner/FirmOwnerForm";

type Props = { params: Promise<{ locale: string }> };

export default async function MyFirmPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <FirmOwnerForm mode="manage" locale={locale} />;
}
