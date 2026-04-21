"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthSession } from "@/components/providers/AuthSessionProvider";

interface Props {
  children: React.ReactNode;
  locale: string;
}

export function AuthGuard({ children, locale }: Props) {
  const { user, loading } = useAuthSession();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/${locale}/giris`);
    }
  }, [loading, user, router, locale]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-(--color-brand) border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
