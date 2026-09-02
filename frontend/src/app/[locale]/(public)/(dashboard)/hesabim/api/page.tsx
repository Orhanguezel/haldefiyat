export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import ApiAccessPanel from "@/components/dashboard/api/ApiAccessPanel";

type Props = { params: Promise<{ locale: string }> };

export default async function ApiErisimPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-(--color-brand)">Entegrasyon</p>
        <h1 className="mt-2 font-(family-name:--font-display) text-2xl font-bold text-(--color-foreground)">API erişimi</h1>
        <p className="mt-1 text-sm text-(--color-muted)">Anahtarlarınızı yönetin, günlük kotanızı izleyin ve planınızı yükseltin.</p>
      </div>
      {/* useSearchParams (odeme donus parametresi) Suspense sinirini gerektirir. */}
      <Suspense fallback={<p className="text-sm text-(--color-muted)">Yükleniyor…</p>}>
        <ApiAccessPanel locale={locale} />
      </Suspense>
    </div>
  );
}
