// src/modules/dealerFinance/repository-batch.ts
import { eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { dealerProfiles } from '@agro/shared-backend/modules/dealerFinance';

/** Onaylı bayi kullanıcı ID’leri (toplu uyarı / cron) */
export async function repoListApprovedDealerUserIds() {
  const rows = await db
    .select({ user_id: dealerProfiles.user_id })
    .from(dealerProfiles)
    .where(eq(dealerProfiles.is_approved, 1));
  return rows.map((r) => r.user_id);
}
