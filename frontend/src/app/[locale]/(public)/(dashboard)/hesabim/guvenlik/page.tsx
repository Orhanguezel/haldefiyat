export const dynamic = "force-dynamic";

import { setRequestLocale } from "next-intl/server";
import { ChangePasswordForm } from "@/components/dashboard/security/ChangePasswordForm";

type Props = { params: Promise<{ locale: string }> };

export default async function GuvenlikPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="space-y-6">
      <h1 className="font-(family-name:--font-display) text-2xl font-bold text-(--color-foreground)">
        Güvenlik
      </h1>
      <ChangePasswordForm />
    </div>
  );
}
