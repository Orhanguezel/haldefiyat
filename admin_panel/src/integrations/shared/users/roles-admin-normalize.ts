// src/integrations/shared/users/roles-admin-normalize.ts
import type { ApiRole, Role } from './roles-admin';
import { toIso, tryParse } from '@/integrations/shared/common';

export const normalizeRole = (r: ApiRole): Role => ({
  ...r,
  permissions: Array.isArray(r.permissions)
    ? r.permissions.map(String)
    : tryParse<string[]>(r.permissions),
  created_at: toIso(r.created_at),
  updated_at: toIso(r.updated_at),
});
