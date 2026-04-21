'use client';

// =============================================================
// FILE: src/app/(main)/admin/_components/sidebar/app-sidebar.tsx
// FINAL — RTK/Redux uyumlu (zustand yok)
// - NavMain: NavGroup[] alır (senin nav-main.tsx böyle)
// =============================================================

import Link from 'next/link';
import Image from 'next/image';
import { LayoutDashboard } from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

import { buildAdminSidebarItems } from '@/navigation/sidebar/sidebar-items';
import type { NavGroup } from '@/navigation/sidebar/sidebar-items';
import type { AdminSidebarRole } from '@/navigation/sidebar/sidebar-items';

import { useAdminUiCopy } from '@/app/(main)/admin/_components/common/use-admin-ui-copy';
import { useAdminT } from '@/app/(main)/admin/_components/common/use-admin-t';
import type { TranslateFn } from '@/i18n';
import { normalizeMeFromStatus } from '@/integrations/shared';

import { useMemo } from 'react';
import { NavMain } from './nav-main';
import { NavUser } from './nav-user';
import { useAdminSettings } from '../admin-settings-provider';
import { useStatusQuery, useGetMyProfileQuery } from '@/integrations/hooks';

type Role = 'admin' | string;

type SidebarMe = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  roles?: Role[];
};

function hasRole(me: SidebarMe, role: Role) {
  if (me.role === role) return true;
  const rs = Array.isArray(me.roles) ? me.roles : [];
  return rs.includes(role);
}

function withPanelTitle(appNameRaw: string, isAdmin: boolean): string {
  const panelTitle = isAdmin ? 'Admin Panel' : 'Satici Panel';
  const cleaned = appNameRaw
    .replace(/\badmin\s*panel\b/gi, '')
    .replace(/\bsatici\s*panel\b/gi, '')
    .trim();
  return cleaned ? `${cleaned} ${panelTitle}` : panelTitle;
}

export function AppSidebar({
  me,
  appName,
  variant,
  collapsible,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  me: SidebarMe;
  appName?: string;
}) {
  const { copy } = useAdminUiCopy();
  const t = useAdminT();

  // Admin settings override for page titles
  const { pageMeta, branding } = useAdminSettings();
  const baseName = (copy.app_name || branding?.app_name || appName || '').trim();

  // ✅ Get real user data
  const { data: statusData } = useStatusQuery();
  const { data: profileData } = useGetMyProfileQuery();

  const currentUser = useMemo(() => {
    const s = statusData?.user;
    const statusMe = normalizeMeFromStatus(statusData as any);
    const statusRole = statusMe?.isAdmin ? 'admin' : (statusMe?.role || s?.role);
    return {
      id: s?.id || me?.id || 'me',
      name: profileData?.full_name || s?.email?.split('@')[0] || me?.name || 'Admin',
      email: s?.email || me?.email || 'admin',
      role: statusRole || me?.role || 'admin',
      avatar: profileData?.avatar_url || me?.avatar || '',
      roles: statusRole ? [statusRole] : (me?.roles || [me?.role || 'admin']),
    };
  }, [statusData, profileData, me]);

  const wrappedT: TranslateFn = (key, params, fallback) => {
    // Check pageMeta override for sidebar items.
    if (
      typeof key === 'string' &&
      (key.startsWith('admin.dashboard.items.') || key.startsWith('admin.sidebar.items.'))
    ) {
      const itemKey = key
        .replace('admin.dashboard.items.', '')
        .replace('admin.sidebar.items.', '');
      // Check if pageMeta has this key and a title
      if (pageMeta?.[itemKey]?.title) {
        return pageMeta[itemKey].title;
      }
    }
    return t(key, params, fallback);
  };

  // ✅ admin ise tüm menu, değilse sadece dashboard
  const sidebarRole: AdminSidebarRole = hasRole(currentUser as any, 'admin') ? 'admin' : 'seller';
  const groupsForMe: NavGroup[] = buildAdminSidebarItems(copy.nav, wrappedT, sidebarRole);
  const panelLabel = withPanelTitle(baseName, sidebarRole === 'admin');
  const panelSub = sidebarRole === 'admin' ? 'Admin Panel' : 'Taşıyıcı Panel';
  const logoUrl =
    branding?.media?.site_logo ||
    branding?.media?.site_logo_dark ||
    branding?.media?.site_logo_light ||
    '';
  const logoAlt = branding?.media?.site_logo_alt || branding?.app_name || 'Hal Fiyatlari';

  return (
    <Sidebar {...props} variant={variant} collapsible={collapsible}>
      <SidebarHeader>
        <Link prefetch={false} href="/admin/dashboard" className="flex items-center gap-3 px-3 py-4 hover:bg-sidebar-accent/50 transition-colors">
          {logoUrl ? (
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border bg-background px-1">
              <Image
                src={logoUrl}
                alt={logoAlt}
                width={40}
                height={40}
                unoptimized
                className="h-8 w-auto object-contain"
              />
            </div>
          ) : (
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <LayoutDashboard className="size-5" />
            </div>
          )}
          <div className="flex flex-col gap-0.5 leading-none">
            <span className="font-bold text-lg tracking-tight">{panelLabel || 'Admin Panel'}</span>
            <span className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">{panelSub}</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {/* ✅ NavMain NavGroup[] bekliyor */}
        <NavMain items={groupsForMe} showQuickCreate={false} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={{ name: currentUser.name, email: currentUser.email, avatar: currentUser.avatar }} />
      </SidebarFooter>
    </Sidebar>
  );
}
