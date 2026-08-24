export const dynamic = "force-dynamic";

import { setRequestLocale } from "next-intl/server";
import { FirmOwnerForm } from "@/components/firms/owner/FirmOwnerForm";
import { fetchFirm } from "@/lib/api";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ firma?: string }>;
};

// `?firma=<slug>` yalnizca hedefi secer. Yetki burada DEGIL, her istekte
// sunucu tarafinda dogrulanir (requireManageableFirm): admin olmayan biri
// parametreyi elle yazarsa API 404 doner, form bos kalir.
export default async function MyFirmPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { firma } = await searchParams;
  setRequestLocale(locale);

  const target = firma ? await fetchFirm(firma) : null;

  return (
    <FirmOwnerForm
      mode="manage"
      locale={locale}
      {...(target ? { adminFirmId: target.id, adminFirmName: target.name } : {})}
    />
  );
}
