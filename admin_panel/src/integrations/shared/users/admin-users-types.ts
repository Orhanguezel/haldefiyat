// =============================================================
// FILE: src/integrations/shared/users/admin-users-types.ts
// Ensotek – Admin Users tipleri
// =============================================================

import type { UserRoleName } from '@/integrations/shared/users/users';

export const ADMIN_USERS_BASE = '/admin/users';

/**
 * Backend rolleri:
 *   "admin" | "moderator" | "seller" | "user"
 * Zaten UserRoleName ile uyumlu.
 */
export type AdminUserRoleName = UserRoleName;

/**
 * Admin list/get endpoint'lerinin döndürdüğü DTO
 * (admin.controller.list / get ile uyumlu)
 */
export type AdminUserDto = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  email_verified: 0 | 1; // MySQL tinyint – 0/1 olarak geliyor
  is_active: 0 | 1; // MySQL tinyint – 0/1 olarak geliyor
  created_at: string; // ISO string (Date serialize)
  last_login_at: string | null; // null olabilir
  role: AdminUserRoleName;
};

/**
 * GET /admin/users query parametreleri
 * (listQuery zod şeması ile uyumlu)
 */
export type AdminUserListQueryParams = {
  q?: string;
  role?: AdminUserRoleName;
  is_active?: boolean; // backend boolean veya 0/1 kabul ediyor
  sort?: 'created_at' | 'email' | 'last_login_at';
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
};

/**
 * PATCH /admin/users/:id body
 * (updateUserBody ile uyumlu)
 */
export type AdminUserUpdatePayload = {
  full_name?: string | null;
  phone?: string | null;
  email?: string;
  is_active?: boolean;
};

/**
 * POST /admin/users/:id/active body
 */
export type AdminUserSetActivePayload = {
  is_active: boolean;
};

/**
 * POST /admin/users/:id/roles body
 */
export type AdminUserSetRolesPayload = {
  roles: AdminUserRoleName[];
};

/**
 * POST /admin/users/:id/password body
 */
export type AdminUserSetPasswordPayload = {
  password: string;
};

/**
 * Ortak { ok: true } cevabı
 */
export type AdminOkResponse = {
  ok: boolean;
};

export type MaybeUsersListResponse = {
  data?: unknown;
  items?: unknown;
  rows?: unknown;
};

export function unwrapAdminUsersList(input: unknown): AdminUserDto[] {
  if (Array.isArray(input)) return input as AdminUserDto[];

  const wrapped = (input ?? {}) as MaybeUsersListResponse;
  if (Array.isArray(wrapped.data)) return wrapped.data as AdminUserDto[];
  if (Array.isArray(wrapped.items)) return wrapped.items as AdminUserDto[];
  if (Array.isArray(wrapped.rows)) return wrapped.rows as AdminUserDto[];

  return [];
}

export function unwrapAdminUser(input: unknown): AdminUserDto {
  if (!input || typeof input !== 'object') return input as AdminUserDto;
  const wrapped = input as { data?: unknown; item?: unknown };
  if (wrapped.data && typeof wrapped.data === 'object') return wrapped.data as AdminUserDto;
  if (wrapped.item && typeof wrapped.item === 'object') return wrapped.item as AdminUserDto;
  return input as AdminUserDto;
}

export function buildAdminUsersListParams(params?: AdminUserListQueryParams): URLSearchParams {
  const p = (params ?? {}) as AdminUserListQueryParams;
  const searchParams = new URLSearchParams();

  if (p.q) searchParams.set('q', p.q);
  if (p.role) searchParams.set('role', p.role);
  if (typeof p.is_active === 'boolean') searchParams.set('is_active', p.is_active ? '1' : '0');
  if (p.limit != null) searchParams.set('limit', String(p.limit));
  if (p.offset != null) searchParams.set('offset', String(p.offset));
  if (p.sort) searchParams.set('sort', p.sort);
  if (p.order) searchParams.set('order', p.order);

  return searchParams;
}
