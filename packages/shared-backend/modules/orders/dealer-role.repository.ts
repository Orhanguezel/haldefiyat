import { and, eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { userRoles } from '../userRoles/schema';

export async function repoUserIsDealer(userId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: userRoles.id })
    .from(userRoles)
    .where(and(eq(userRoles.user_id, userId), eq(userRoles.role, 'dealer')))
    .limit(1);
  return !!row;
}
