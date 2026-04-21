export const dynamic = "force-dynamic";

import { setRequestLocale } from "next-intl/server";

type Props = { params: Promise<{ locale: string }> };

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-display text-4xl font-bold text-(--color-foreground)">
        Gizlilik Politikası
      </h1>
      <p className="mt-4 text-lg text-(--color-muted)">
        HalDeFiyat olarak kullanıcı gizliliğine önem veriyoruz. Bu sayfa yakında
        güncellenecektir.
      </p>
    </main>
  );
}
