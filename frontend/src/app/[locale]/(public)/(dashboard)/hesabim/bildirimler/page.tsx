export const dynamic = "force-dynamic";

import { setRequestLocale } from "next-intl/server";
import { NotificationList } from "@/components/dashboard/notifications/NotificationList";

type Props = { params: Promise<{ locale: string }> };

export default async function BildirimlerPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="space-y-6">
      <h1 className="font-(family-name:--font-display) text-2xl font-bold text-(--color-foreground)">
        Bildirimler
      </h1>
      <NotificationList />
    </div>
  );
}
