// src/modules/wallet/helpers/admin.ts
// Local wallet admin helpers

export function parseAdminWalletPaging(query: Record<string, string>) {
  const pageNum = Math.max(1, parseInt(query.page ?? '1', 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(query.limit ?? '20', 10)));
  const offset = (pageNum - 1) * limitNum;
  return { page: pageNum, limit: limitNum, offset };
}
