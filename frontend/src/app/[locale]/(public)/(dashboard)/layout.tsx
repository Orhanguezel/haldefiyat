export const dynamic = "force-dynamic";

import { setRequestLocale } from "next-intl/server";
import { AuthGuard } from "@/components/providers/AuthGuard";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardMobileNav } from "@/components/dashboard/DashboardMobileNav";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface Props {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function DashboardLayout({ children, params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <AuthGuard locale={locale}>
      <div className="container mx-auto px-4 py-8 md:py-12">
        <DashboardMobileNav locale={locale} />
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Desktop Sidebar */}
          <aside className="hidden w-64 shrink-0 lg:block">
            <div className="sticky top-32">
              <DashboardSidebar locale={locale} />
            </div>
          </aside>

          {/* İçerik */}
          <div className="flex-1 min-w-0">
            {children}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
