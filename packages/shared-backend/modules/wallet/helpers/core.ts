// src/modules/wallet/helpers/core.ts
// Local wallet core helpers

import { randomUUID } from 'crypto';
import { db } from '../../../db/client';
import { eq } from 'drizzle-orm';
import { wallets, type Wallet } from '../schema';

export async function getOrCreateWallet(userId: string): Promise<Wallet> {
  const [existing] = await db.select().from(wallets).where(eq(wallets.user_id, userId)).limit(1);
  if (existing) return existing;

  const id = randomUUID();
  await db.insert(wallets).values({ id, user_id: userId });
  const [created] = await db.select().from(wallets).where(eq(wallets.id, id)).limit(1);
  return created;
}

export function parseWalletPaging(query: Record<string, string>) {
  const pageNum = Math.max(1, parseInt(query.page ?? '1', 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(query.limit ?? '20', 10)));
  const offset = (pageNum - 1) * limitNum;
  return { page: pageNum, limit: limitNum, offset };
}
