// =============================================================
// FILE: src/modules/emailTemplates/admin.controller.ts
// Admin email template handlers
// =============================================================
import type { FastifyRequest, FastifyReply } from 'fastify';
import { handleRouteError } from '../_shared';
import {
  repoListEmailTemplates,
  repoGetEmailTemplateById,
  repoCreateEmailTemplate,
  repoUpdateEmailTemplate,
  repoDeleteEmailTemplate,
  toListItem,
  toDetail,
  type EmailTemplateUpdateFields,
} from './repository';

type EmailTemplateBody = {
  template_key?: string;
  template_name?: string | null;
  subject?: string | null;
  content?: string | null;
  content_html?: string | null;
  variables?: unknown;
  is_active?: boolean;
};

/** GET /admin/email_templates */
export async function adminListEmailTemplates(req: FastifyRequest, reply: FastifyReply) {
  try {
    const q = (req.query || {}) as Record<string, string | undefined>;
    const limit = Math.min(parseInt(q.limit || '200', 10) || 200, 500);
    const offset = Math.max(parseInt(q.offset || '0', 10) || 0, 0);
    const isActive =
      q.is_active === 'true' ? true :
      q.is_active === 'false' ? false :
      undefined;

    const { rows, total } = await repoListEmailTemplates({
      q: q.q,
      is_active: isActive,
      limit,
      offset,
    });

    reply.header('x-total-count', String(total));
    return reply.send(rows.map(toListItem));
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_list_email_templates');
  }
}

/** GET /admin/email_templates/:id */
export async function adminGetEmailTemplate(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const row = await repoGetEmailTemplateById(id);
    if (!row) return reply.code(404).send({ error: { message: 'not_found' } });
    return reply.send(toDetail(row));
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_get_email_template');
  }
}

/** POST /admin/email_templates */
export async function adminCreateEmailTemplate(req: FastifyRequest, reply: FastifyReply) {
  try {
    const body = (req.body || {}) as EmailTemplateBody;
    const created = await repoCreateEmailTemplate({
      template_key: body.template_key ?? '',
      template_name: body.template_name,
      subject: body.subject,
      content_html: body.content ?? body.content_html,
      variables: body.variables
        ? (typeof body.variables === 'string' ? body.variables : JSON.stringify(body.variables))
        : null,
      is_active: body.is_active,
    });
    return reply.code(201).send(toListItem(created!));
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_create_email_template');
  }
}

/** PATCH /admin/email_templates/:id */
export async function adminUpdateEmailTemplate(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const body = (req.body || {}) as EmailTemplateBody;
    const fields: EmailTemplateUpdateFields = {};
    if ('template_key' in body && body.template_key !== undefined) fields.template_key = body.template_key;
    if ('template_name' in body && body.template_name !== undefined) fields.template_name = body.template_name;
    if ('subject' in body && body.subject !== undefined) fields.subject = body.subject;
    if ('content' in body && body.content !== undefined) fields.content_html = body.content;
    if ('content_html' in body && body.content_html !== undefined) fields.content_html = body.content_html;
    if ('variables' in body) fields.variables = typeof body.variables === 'string' ? body.variables : JSON.stringify(body.variables);
    if ('is_active' in body && body.is_active !== undefined) fields.is_active = body.is_active;

    const updated = await repoUpdateEmailTemplate(id, fields);
    if (!updated) return reply.code(404).send({ error: { message: 'not_found' } });
    return reply.send(toListItem(updated));
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_update_email_template');
  }
}

/** DELETE /admin/email_templates/:id */
export async function adminDeleteEmailTemplate(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    await repoDeleteEmailTemplate(id);
    return reply.code(204).send();
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_delete_email_template');
  }
}
