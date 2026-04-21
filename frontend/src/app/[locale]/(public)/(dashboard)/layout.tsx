export const dynamic = "force-dynamic";

import { setRequestLocale } from "next-intl/server";
import { AuthGuard } from "@/components/providers/AuthGuard";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardMobileNav } from "@/components/dashboard/DashboardMobileNav";

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

        {/* Mobil alt nav bar (opsiyonel ama dashboard ozelligi olarak kalsin) */}
        <div className="lg:hidden">
          <DashboardMobileNav locale={locale} />
        </div>
      </div>
    </AuthGuard>
  );
}
