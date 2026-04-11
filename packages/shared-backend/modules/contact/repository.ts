// =============================================================
// FILE: src/modules/contact/repository.ts
// =============================================================
import { randomUUID } from "crypto";
import { db } from "../../db/client";
import {
  contact_messages,
  type ContactView,
} from "./schema";
import {
  eq,
} from "drizzle-orm";
import {
  buildContactInsert,
  buildContactListWhere,
  buildContactOrderExpr,
  buildContactPatch,
} from "./helpers";
import type {
  ContactCreateInput,
  ContactListParams,
  ContactUpdateInput,
} from "./validation";

export async function repoCreateContact(
  body: ContactCreateInput & { ip?: string | null; user_agent?: string | null },
): Promise<ContactView> {
  const id = randomUUID();
  const insert = buildContactInsert(body, id);

  await db.insert(contact_messages).values(insert);

  const [row] = await db
    .select()
    .from(contact_messages)
    .where(eq(contact_messages.id, id))
    .limit(1);

  return row as ContactView;
}

export async function repoGetContactById(id: string): Promise<ContactView | null> {
  const [row] = await db
    .select()
    .from(contact_messages)
    .where(eq(contact_messages.id, id))
    .limit(1);

  return (row ?? null) as ContactView | null;
}

export async function repoListContacts(
  params: ContactListParams,
): Promise<ContactView[]> {
  const { limit = 50, offset = 0, orderBy, order = "desc" } = params;
  const whereExpr = buildContactListWhere(params);
  const orderExpr = buildContactOrderExpr(orderBy, order);

  const baseQuery = db
    .select()
    .from(contact_messages);

  const rows = await (whereExpr ? baseQuery.where(whereExpr) : baseQuery)
    .orderBy(orderExpr)
    .limit(Number(limit))
    .offset(Number(offset));

  return rows as ContactView[];
}

export async function repoUpdateContact(
  id: string,
  body: ContactUpdateInput,
): Promise<ContactView | null> {
  const patch = buildContactPatch(body);

  if (Object.keys(patch).length === 0) {
    return repoGetContactById(id);
  }

  await db
    .update(contact_messages)
    .set({
      ...patch,
      updated_at: new Date(),
    })
    .where(eq(contact_messages.id, id));

  return repoGetContactById(id);
}

export async function repoDeleteContact(id: string): Promise<boolean> {
  const res = await db
    .delete(contact_messages)
    .where(eq(contact_messages.id, id))
    .execute();

  const affectedRows =
    typeof res === 'object' && res !== null && 'affectedRows' in res
      ? Number((res as { affectedRows?: unknown }).affectedRows ?? 0)
      : 0;

  return affectedRows > 0;
}
