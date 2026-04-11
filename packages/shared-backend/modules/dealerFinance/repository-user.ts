// src/modules/dealerFinance/repository-user.ts
import { eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { users } from '../auth/schema';

export async function repoGetUserEmailById(userId: string) {
  const [row] = await db
    .select({ email: users.email, full_name: users.full_name })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row ?? null;
}
