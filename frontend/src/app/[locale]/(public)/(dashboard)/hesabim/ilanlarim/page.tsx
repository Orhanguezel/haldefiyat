export const dynamic = "force-dynamic";

import { setRequestLocale } from "next-intl/server";
import { MyListingsClient } from "@/components/listings/MyListingsClient";

type Props = { params: Promise<{ locale: string }> };

export default async function MyListingsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className="space-y-6">
      <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-(--color-brand)">İlan yönetimi</p><h1 className="mt-2 font-(family-name:--font-display) text-2xl font-bold text-(--color-foreground)">İlanlarım</h1><p className="mt-2 text-sm text-(--color-muted)">Yayın durumunu, talep sayısını ve ilan bazlı iletişim tercihlerini yönetin.</p></div>
      <MyListingsClient />
    </div>
  );
}
