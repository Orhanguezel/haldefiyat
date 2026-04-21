export const dynamic = "force-dynamic";

import { setRequestLocale } from "next-intl/server";
import { FavoritesList } from "@/components/dashboard/favorites/FavoritesList";

type Props = { params: Promise<{ locale: string }> };

export default async function FavorilerPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="space-y-6">
      <h1 className="font-(family-name:--font-display) text-2xl font-bold text-(--color-foreground)">
        Favorilerim
      </h1>
      <FavoritesList locale={locale} />
    </div>
  );
}
