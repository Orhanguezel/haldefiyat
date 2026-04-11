import { and, eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { users } from '../auth/schema';
import { userRoles } from '../userRoles/schema';

export async function repoGetPublicSellerById(id: string) {
  const [row] = await db
    .select({
      id: users.id,
      name: users.full_name,
    })
    .from(users)
    .innerJoin(userRoles, eq(userRoles.user_id, users.id))
    .where(
      and(eq(users.id, id), eq(users.is_active, 1 as never), eq(userRoles.role, 'dealer')),
    )
    .limit(1);

  return row ?? null;
}

export async function repoUserIsDealer(userId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: userRoles.id })
    .from(userRoles)
    .where(and(eq(userRoles.user_id, userId), eq(userRoles.role, 'dealer')))
    .limit(1);

  return !!row;
}
