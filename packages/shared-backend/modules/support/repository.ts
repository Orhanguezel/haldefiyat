import { randomUUID } from 'crypto';
import { and, asc, eq, inArray, like, or } from 'drizzle-orm';
import { db } from '../../db/client';
import { normalizeLocaleStr, toBool } from '@agro/shared-backend/modules/_shared';
import { supportFaqs, supportFaqsI18n, supportTickets } from './schema';
import { repoInsertTicketMessage } from './ticket-messages.repository';
import type {
  FaqCreateInput,
  FaqListQueryInput,
  FaqUpdateInput,
  TicketCreateInput,
  TicketListQueryInput,
  TicketUpdateInput,
} from './validation';

type FaqRow = {
  id: string;
  category: string;
  display_order: number;
  is_published: number;
  created_at: string | Date;
  updated_at: string | Date;
  locale: string;
  question: string;
  answer: string | null;
};

function pickFaqRow<T extends FaqRow>(rows: T[], locale: string): T | null {
  if (!rows.length) return null;
  return rows.find((row) => row.locale === locale) ?? rows.find((row) => row.locale === 'tr') ?? rows[0] ?? null;
}

export async function repoListFaqs(params: FaqListQueryInput) {
  const locale = normalizeLocaleStr(params.locale) || 'tr';
  const conditions = [] as ReturnType<typeof eq>[];
  if (params.category) conditions.push(eq(supportFaqs.category, params.category));
  if (params.is_published !== undefined) conditions.push(eq(supportFaqs.is_published, toBool(params.is_published) ? 1 : 0));
  const rows = await db
    .select({
      id: supportFaqs.id,
      category: supportFaqs.category,
      display_order: supportFaqs.display_order,
      is_published: supportFaqs.is_published,
      created_at: supportFaqs.created_at,
      updated_at: supportFaqs.updated_at,
      locale: supportFaqsI18n.locale,
      question: supportFaqsI18n.question,
      answer: supportFaqsI18n.answer,
    })
    .from(supportFaqs)
    .innerJoin(supportFaqsI18n, eq(supportFaqs.id, supportFaqsI18n.faq_id))
    .where(and(...conditions, inArray(supportFaqsI18n.locale, [locale, 'tr'])))
    .orderBy(asc(supportFaqs.display_order));

  const picked = new Map<string, FaqRow>();
  for (const row of rows) {
    const current = picked.get(row.id);
    const next = pickFaqRow([...(current ? [current] : []), row], locale);
    if (next) picked.set(row.id, next);
  }
  return Array.from(picked.values()).slice(params.offset, params.offset + params.limit);
}

export async function repoGetFaqById(id: string, locale = 'tr') {
  const rows = await db
    .select({
      id: supportFaqs.id,
      category: supportFaqs.category,
      display_order: supportFaqs.display_order,
      is_published: supportFaqs.is_published,
      created_at: supportFaqs.created_at,
      updated_at: supportFaqs.updated_at,
      locale: supportFaqsI18n.locale,
      question: supportFaqsI18n.question,
      answer: supportFaqsI18n.answer,
    })
    .from(supportFaqs)
    .innerJoin(supportFaqsI18n, eq(supportFaqs.id, supportFaqsI18n.faq_id))
    .where(and(eq(supportFaqs.id, id), inArray(supportFaqsI18n.locale, [locale, 'tr'])));
  return pickFaqRow(rows, locale);
}

export async function repoCreateFaq(data: FaqCreateInput) {
  const id = randomUUID();
  await db.insert(supportFaqs).values({
    id,
    category: data.category,
    display_order: data.display_order ?? 0,
    is_published: data.is_published !== undefined ? (toBool(data.is_published) ? 1 : 0) : 1,
  });
  await db.insert(supportFaqsI18n).values({
    faq_id: id,
    locale: data.locale,
    question: data.question,
    answer: data.answer,
  });
  return { id };
}

export async function repoUpdateFaq(id: string, data: FaqUpdateInput) {
  const faqPatch: Record<string, unknown> = {};
  if (data.category !== undefined) faqPatch.category = data.category;
  if (data.display_order !== undefined) faqPatch.display_order = data.display_order;
  if (data.is_published !== undefined) faqPatch.is_published = toBool(data.is_published) ? 1 : 0;
  if (Object.keys(faqPatch).length) await db.update(supportFaqs).set(faqPatch).where(eq(supportFaqs.id, id));
  const i18nPatch: Record<string, unknown> = {};
  if (data.question !== undefined) i18nPatch.question = data.question;
  if (data.answer !== undefined) i18nPatch.answer = data.answer;
  if (Object.keys(i18nPatch).length) {
    const [existingI18n] = await db
      .select({ faq_id: supportFaqsI18n.faq_id })
      .from(supportFaqsI18n)
      .where(and(eq(supportFaqsI18n.faq_id, id), eq(supportFaqsI18n.locale, data.locale)))
      .limit(1);

    if (existingI18n) {
      await db
        .update(supportFaqsI18n)
        .set(i18nPatch)
        .where(and(eq(supportFaqsI18n.faq_id, id), eq(supportFaqsI18n.locale, data.locale)));
    } else {
      await db.insert(supportFaqsI18n).values({
        faq_id: id,
        locale: data.locale,
        question: String(i18nPatch.question || ''),
        answer: String(i18nPatch.answer || ''),
      });
    }
  }
}

export async function repoDeleteFaq(id: string) {
  await db.delete(supportFaqs).where(eq(supportFaqs.id, id));
}

export async function repoReorderFaqs(items: { id: string; display_order: number }[]) {
  for (const item of items) {
    await db.update(supportFaqs).set({ display_order: item.display_order }).where(eq(supportFaqs.id, item.id));
  }
}

function buildTicketFilters(params: TicketListQueryInput, userId?: string) {
  const conditions = [] as ReturnType<typeof eq>[];
  if (userId) conditions.push(eq(supportTickets.user_id, userId));
  if (params.status) conditions.push(eq(supportTickets.status, params.status));
  if (params.category) conditions.push(eq(supportTickets.category, params.category));
  if (params.priority) conditions.push(eq(supportTickets.priority, params.priority));
  if (params.search) {
    const needle = `%${params.search}%`;
    conditions.push(or(like(supportTickets.subject, needle), like(supportTickets.email, needle), like(supportTickets.name, needle))!);
  }
  return conditions;
}

export async function repoListTickets(params: TicketListQueryInput) {
  return db
    .select()
    .from(supportTickets)
    .where(and(...buildTicketFilters(params)))
    .orderBy(asc(supportTickets.created_at))
    .limit(params.limit)
    .offset(params.offset);
}

export async function repoGetTicketById(id: string) {
  const [row] = await db.select().from(supportTickets).where(eq(supportTickets.id, id)).limit(1);
  return row ?? null;
}

export async function repoCreateTicket(data: TicketCreateInput & {
  user_id?: string | null;
  ip?: string | null;
  user_agent?: string | null;
}) {
  const id = randomUUID();
  await db.insert(supportTickets).values({
    id,
    user_id: data.user_id ?? null,
    name: data.name,
    email: data.email,
    subject: data.subject,
    message: data.message,
    category: data.category,
    status: 'open',
    priority: 'normal',
    ip: data.ip ?? null,
    user_agent: data.user_agent ?? null,
  });
  await repoInsertTicketMessage({
    ticket_id: id,
    sender_type: 'user',
    author_id: data.user_id ?? null,
    body: data.message,
  });
  return repoGetTicketById(id);
}

export async function repoUpdateTicket(id: string, data: TicketUpdateInput) {
  await db.update(supportTickets).set({ ...data, updated_at: new Date() }).where(eq(supportTickets.id, id));
  return repoGetTicketById(id);
}

export async function repoDeleteTicket(id: string) {
  await db.delete(supportTickets).where(eq(supportTickets.id, id));
}

export async function repoListMyTickets(userId: string, params: TicketListQueryInput) {
  return db
    .select()
    .from(supportTickets)
    .where(and(...buildTicketFilters(params, userId)))
    .orderBy(asc(supportTickets.created_at))
    .limit(params.limit)
    .offset(params.offset);
}
