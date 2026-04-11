import { randomUUID } from 'crypto';
import { asc, eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { supportTicketMessages, supportTickets } from './schema';

export async function repoInsertTicketMessage(input: {
  ticket_id: string;
  sender_type: 'user' | 'staff';
  author_id: string | null;
  body: string;
}) {
  const id = randomUUID();
  await db.insert(supportTicketMessages).values({
    id,
    ticket_id: input.ticket_id,
    sender_type: input.sender_type,
    author_id: input.author_id,
    body: input.body,
  });
  return repoGetTicketMessageById(id);
}

export async function repoGetTicketMessageById(id: string) {
  const [row] = await db.select().from(supportTicketMessages).where(eq(supportTicketMessages.id, id)).limit(1);
  return row ?? null;
}

export async function repoListTicketMessages(ticketId: string) {
  return db
    .select()
    .from(supportTicketMessages)
    .where(eq(supportTicketMessages.ticket_id, ticketId))
    .orderBy(asc(supportTicketMessages.created_at));
}

export async function repoTouchTicketUpdatedAt(ticketId: string) {
  await db.update(supportTickets).set({ updated_at: new Date() }).where(eq(supportTickets.id, ticketId));
}
