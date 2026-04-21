export const dynamic = "force-dynamic";

import { setRequestLocale } from "next-intl/server";
import { ProfileForm } from "@/components/dashboard/profile/ProfileForm";
import { AvatarUpload } from "@/components/dashboard/profile/AvatarUpload";

type Props = { params: Promise<{ locale: string }> };

export default async function ProfilPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="space-y-6">
      <h1 className="font-(family-name:--font-display) text-2xl font-bold text-(--color-foreground)">
        Profilim
      </h1>
      <AvatarUpload />
      <ProfileForm />
    </div>
  );
}
