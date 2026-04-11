// =============================================================
// FILE: src/modules/emailTemplates/repository.ts
// Email templates DB sorguları
// =============================================================
import { db } from '../../db/client';
import { randomUUID } from 'crypto';
import { and, asc, eq, like, sql, type SQL } from 'drizzle-orm';
import { emailTemplates } from './schema';

export type EmailTemplateUpdateFields = Partial<typeof emailTemplates.$inferInsert>;

/* ================================================================
 * HELPERS (formatting)
 * ================================================================ */

function parseVariables(raw: string | null | undefined): string[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function detectVariables(content: string): string[] {
  const matches = content.matchAll(/\{\{(\w+)\}\}/g);
  return [...new Set([...matches].map((m) => m[1]))];
}

export function toListItem(row: typeof emailTemplates.$inferSelect) {
  const vars = parseVariables(row.variables);
  const detected = row.content_html ? detectVariables(row.content_html) : [];
  return {
    id: row.id,
    template_key: row.template_key,
    template_name: row.template_name ?? null,
    subject: row.subject ?? null,
    content: row.content_html ?? null,
    locale: 'tr',
    variables: vars,
    detected_variables: detected,
    is_active: Boolean(row.is_active),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function toDetail(row: typeof emailTemplates.$inferSelect) {
  const vars = parseVariables(row.variables);
  const detected = row.content_html ? detectVariables(row.content_html) : [];
  return {
    id: row.id,
    template_key: row.template_key,
    variables: vars,
    is_active: Boolean(row.is_active),
    created_at: row.created_at,
    updated_at: row.updated_at,
    translations: [
      {
        id: row.id,
        locale: 'tr',
        template_name: row.template_name ?? '',
        subject: row.subject ?? '',
        content: row.content_html ?? '',
        detected_variables: detected,
        created_at: row.created_at,
        updated_at: row.updated_at,
      },
    ],
  };
}

/* ================================================================
 * DB QUERIES
 * ================================================================ */

export async function repoListEmailTemplates(params: {
  q?: string;
  is_active?: boolean;
  limit: number;
  offset: number;
}) {
  let qb = db.select().from(emailTemplates).$dynamic();
  const whereParts: SQL[] = [];
  if (params.q) whereParts.push(like(emailTemplates.template_key, `%${params.q}%`));
  if (typeof params.is_active === 'boolean') {
    whereParts.push(eq(emailTemplates.is_active, params.is_active));
  }
  if (whereParts.length === 1) qb = qb.where(whereParts[0] as never);
  if (whereParts.length > 1) qb = qb.where(and(...whereParts) as never);

  const [{ total }] = await db.select({ total: sql<number>`COUNT(*)` }).from(emailTemplates);
  const rows = await qb.orderBy(asc(emailTemplates.template_key)).limit(params.limit).offset(params.offset);

  return { rows, total: Number(total || 0) };
}

export async function repoGetEmailTemplateById(id: string) {
  const [row] = await db.select().from(emailTemplates).where(eq(emailTemplates.id, id)).limit(1);
  return row ?? null;
}

export async function repoCreateEmailTemplate(data: {
  template_key: string;
  template_name?: string | null;
  subject?: string | null;
  content_html?: string | null;
  variables?: string | null;
  is_active?: boolean;
}) {
  const id = randomUUID();
  await db.insert(emailTemplates).values({
    id,
    template_key: data.template_key || '',
    template_name: data.template_name ?? null,
    subject: data.subject ?? null,
    content_html: data.content_html ?? null,
    variables: data.variables ?? null,
    is_active: data.is_active ?? true,
  });
  return repoGetEmailTemplateById(id);
}

export async function repoUpdateEmailTemplate(id: string, fields: EmailTemplateUpdateFields) {
  if (Object.keys(fields).length) {
    await db.update(emailTemplates).set(fields).where(eq(emailTemplates.id, id));
  }
  return repoGetEmailTemplateById(id);
}

export async function repoDeleteEmailTemplate(id: string) {
  await db.delete(emailTemplates).where(eq(emailTemplates.id, id));
}
