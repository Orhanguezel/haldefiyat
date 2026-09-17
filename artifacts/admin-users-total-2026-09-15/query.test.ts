import { test, expect } from 'bun:test';
import { adminListUsersQuery } from '../../../../packages/shared-backend/modules/auth/admin.validation';
import { buildAdminUsersWhere } from '../../../../packages/shared-backend/modules/auth/helpers/repository';
import { MySqlDialect } from 'drizzle-orm/mysql-core';
test('inactive filter preserves false and rejects invalid booleans', () => {
  expect(adminListUsersQuery.parse({is_active:'false'}).is_active).toBe(false);
  expect(adminListUsersQuery.parse({is_active:'0'}).is_active).toBe(false);
  expect(adminListUsersQuery.parse({is_active:'true'}).is_active).toBe(true);
  expect(adminListUsersQuery.safeParse({is_active:'wrong'}).success).toBe(false);
});
test('role and search constrain SQL before pagination and count', () => {
  const q = new MySqlDialect().sqlToQuery(buildAdminUsersWhere({role:'admin',q:'sample',is_active:false})!);
  expect(q.sql).toContain('SELECT ur.role');
  expect(q.sql).toContain('full_name');
  expect(q.sql).toContain('phone');
  expect(q.params).toContain('admin');
  expect(q.params).toContain(0);
});
