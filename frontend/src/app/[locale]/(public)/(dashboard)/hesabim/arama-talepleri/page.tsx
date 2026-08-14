export const dynamic = "force-dynamic";

import { setRequestLocale } from "next-intl/server";
import { CallRequestContactSummary } from "@/components/listings/CallRequestContactSummary";
import { CallRequestDashboard } from "@/components/listings/CallRequestDashboard";

type Props = { params: Promise<{ locale: string }> };

export default async function CallRequestsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className="space-y-6">
      <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-(--color-brand)">Gelen kutusu</p><h1 className="mt-2 font-(family-name:--font-display) text-2xl font-bold text-(--color-foreground)">Arama talepleri</h1><p className="mt-2 text-sm leading-6 text-(--color-muted)">Gönderdiğiniz ve ilanlarınıza gelen geri arama taleplerini, telefon numaralarını açık paylaşmadan yönetin.</p></div>
      <CallRequestContactSummary />
      <CallRequestDashboard />
    </div>
  );
}
