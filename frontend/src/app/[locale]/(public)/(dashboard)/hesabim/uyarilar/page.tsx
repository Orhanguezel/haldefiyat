export const dynamic = "force-dynamic";

import { setRequestLocale } from "next-intl/server";
import { AlertsList } from "@/components/dashboard/alerts/AlertsList";

type Props = { params: Promise<{ locale: string }> };

export default async function UyarilarPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-(family-name:--font-display) text-2xl font-bold text-(--color-foreground)">
          Uyarılarım
        </h1>
      </div>
      <AlertsList locale={locale} />
    </div>
  );
}
