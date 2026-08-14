export const dynamic = "force-dynamic";

import { setRequestLocale } from "next-intl/server";
import { NotificationList } from "@/components/dashboard/notifications/NotificationList";

type Props = { params: Promise<{ locale: string }> };

export default async function BildirimlerPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="space-y-6">
      <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-(--color-brand)">Hesap akışı</p><h1 className="mt-2 font-(family-name:--font-display) text-2xl font-bold text-(--color-foreground)">Bildirimler</h1></div>
      <NotificationList />
    </div>
  );
}
