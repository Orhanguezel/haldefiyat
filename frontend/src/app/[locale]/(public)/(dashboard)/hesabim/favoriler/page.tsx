export const dynamic = "force-dynamic";

import { setRequestLocale } from "next-intl/server";
import { FavoritesList } from "@/components/dashboard/favorites/FavoritesList";

type Props = { params: Promise<{ locale: string }> };

export default async function FavorilerPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="space-y-6">
      <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-(--color-brand)">İzleme listesi</p><h1 className="mt-2 font-(family-name:--font-display) text-2xl font-bold text-(--color-foreground)">Favorilerim</h1></div>
      <FavoritesList locale={locale} />
    </div>
  );
}
