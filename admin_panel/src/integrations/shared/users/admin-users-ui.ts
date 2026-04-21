import type { AdminUserView, AdminUsersListParams, UserRoleName } from './users';
import { toNonNegativeInt } from '@/integrations/shared/common';

export const ADMIN_USERS_ALL_ROLES: UserRoleName[] = ['admin', 'moderator', 'seller', 'user'];
export const ADMIN_USERS_DEFAULT_LIMIT = 20;

export function getAdminUserRoleLocaleKey(role: UserRoleName): 'admin' | 'moderator' | 'seller' | 'user' {
  if (role === 'admin') return 'admin';
  if (role === 'moderator') return 'moderator';
  if (role === 'seller') return 'seller';
  return 'user';
}

export function parseAdminUsersBoolParam(value: string | null): boolean | undefined {
  if (value == null) return undefined;

  const normalized = value.trim();

  if (normalized === '1' || normalized === 'true') return true;
  if (normalized === '0' || normalized === 'false') return false;

  return undefined;
}

export function pickAdminUsersQuery(searchParams: URLSearchParams): AdminUsersListParams {
  const q = searchParams.get('q') ?? undefined;
  const role = (searchParams.get('role') ?? undefined) as UserRoleName | undefined;
  const is_active = parseAdminUsersBoolParam(searchParams.get('is_active'));
  const limit =
    toNonNegativeInt(searchParams.get('limit'), ADMIN_USERS_DEFAULT_LIMIT) ||
    ADMIN_USERS_DEFAULT_LIMIT;
  const offset = toNonNegativeInt(searchParams.get('offset'), 0);
  const sort = (searchParams.get('sort') ?? undefined) as AdminUsersListParams['sort'] | undefined;
  const order = (searchParams.get('order') ?? undefined) as AdminUsersListParams['order'] | undefined;

  return {
    ...(q ? { q } : {}),
    ...(role ? { role } : {}),
    ...(typeof is_active === 'boolean' ? { is_active } : {}),
    limit,
    offset,
    ...(sort ? { sort } : {}),
    ...(order ? { order } : {}),
  };
}

export function toAdminUsersSearchParams(params: AdminUsersListParams): string {
  const searchParams = new URLSearchParams();

  if (params.q) searchParams.set('q', params.q);
  if (params.role) searchParams.set('role', params.role);
  if (typeof params.is_active === 'boolean') {
    searchParams.set('is_active', params.is_active ? '1' : '0');
  }
  if (params.limit != null) searchParams.set('limit', String(params.limit));
  if (params.offset != null) searchParams.set('offset', String(params.offset));
  if (params.sort) searchParams.set('sort', params.sort);
  if (params.order) searchParams.set('order', params.order);

  return searchParams.toString();
}

export function getAdminUserDisplayName(
  user: Pick<AdminUserView, 'full_name'>,
  unknownLabel: string,
): string {
  const fullName = String(user.full_name ?? '').trim();
  return fullName || unknownLabel;
}

export function isAdminUserView(user: AdminUserView): boolean {
  return user.roles.includes('admin');
}

export function getAdminUserPrimaryRole(user: Pick<AdminUserView, 'roles'>): UserRoleName {
  return (user.roles[0] ?? 'user') as UserRoleName;
}

export function getAdminUsersNextOffset(offset: number, limit: number): number {
  return offset + limit;
}

export function getAdminUsersPreviousOffset(offset: number, limit: number): number {
  return Math.max(0, offset - limit);
}
