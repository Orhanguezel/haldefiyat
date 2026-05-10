// =============================================================
// FILE: src/app/(main)/admin/_components/admin-auth-gate.tsx
// FINAL — Admin Auth Gate (RTK status)
// - NO manual fetch
// - Redirects to /admin/auth/login when not admin
// =============================================================

'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { useStatusQuery } from '@/integrations/hooks';
import type { AuthStatusResponse } from '@/integrations/shared';
import { normalizeMeFromStatus } from '@/integrations/shared';
import { canAccessAdminPath } from '@/navigation/permissions';

export default function AdminAuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  // RTK GET /auth/status
  const q = useStatusQuery();

  React.useEffect(() => {
    if (q.isFetching) return;
    if (q.isUninitialized) return;

    const data = q.data as AuthStatusResponse | undefined;
    const me = normalizeMeFromStatus(data);

    if (!me) {
      router.replace('/admin/auth/login');
      return;
    }

    if (me.isAdmin === true && canAccessAdminPath('admin', pathname)) return;
    if (me.role === 'seller' && canAccessAdminPath('seller', pathname)) return;

    router.replace('/admin/auth/login');
  }, [q.isFetching, q.isUninitialized, q.data, router, pathname]);

  // Loading state (blank or skeleton)
  if (q.isFetching || q.isUninitialized) {
    return null; // istersen burada spinner/skeleton bas
  }

  // If unauthorized, effect will redirect; avoid flashing UI
  const me = normalizeMeFromStatus(q.data as AuthStatusResponse | undefined);
  const allowed =
    !!me &&
    ((me.isAdmin === true && canAccessAdminPath('admin', pathname)) ||
      (me.role === 'seller' && canAccessAdminPath('seller', pathname)));
  if (!allowed) return null;

  return <>{children}</>;
}
