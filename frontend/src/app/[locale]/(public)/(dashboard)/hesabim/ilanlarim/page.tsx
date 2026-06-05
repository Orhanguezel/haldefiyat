export const dynamic = "force-dynamic";

import { setRequestLocale } from "next-intl/server";
import { MyListingsClient } from "@/components/listings/MyListingsClient";

type Props = { params: Promise<{ locale: string }> };

export default async function MyListingsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className="space-y-6">
      <h1 className="font-(family-name:--font-display) text-2xl font-bold text-(--color-foreground)">İlanlarım</h1>
      <MyListingsClient />
    </div>
  );
}
