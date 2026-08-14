"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthSession } from "@/components/providers/AuthSessionProvider";

interface Props {
  children: React.ReactNode;
  locale: string;
}

export function AuthGuard({ children, locale }: Props) {
  const { user, loading } = useAuthSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/${locale}/giris?next=${encodeURIComponent(pathname)}`);
    }
  }, [loading, user, router, locale, pathname]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-live="polite">
        <div className="flex items-center gap-3 rounded-[8px] border border-(--color-border) bg-(--color-surface) px-5 py-4 text-sm text-(--color-muted)">
          <span aria-hidden className="h-5 w-5 animate-spin rounded-full border-2 border-(--color-brand) border-t-transparent" />
          Oturum kontrol ediliyor…
        </div>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
