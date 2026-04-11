import { repoDeleteCacheByPrefixes } from '@agro/shared-backend/modules/_shared';

/** Redis önbellekte cüzdan/admin özetleri için best-effort temizlik */
export async function invalidateWalletCachesForUsers(userIds: string[]): Promise<void> {
  if (userIds.length === 0) return;
  const prefixes = userIds.map((id) => `cache:wallet:user:${id}`);
  await repoDeleteCacheByPrefixes(prefixes);
}
