// src/modules/contact/helpers/repository.ts
import {
  and,
  asc,
  desc,
  eq,
  sql,
  type SQL,
} from "drizzle-orm";
import { contact_messages, type ContactInsert } from "../schema";
import type { ContactCreateInput, ContactListParams, ContactUpdateInput } from "../validation";

type ContactOrderBy = NonNullable<ContactListParams["orderBy"]>;
type ContactOrder = NonNullable<ContactListParams["order"]>;

export function resolveContactOrderBy(col?: string): ContactOrderBy {
  switch (col) {
    case "created_at":
    case "updated_at":
    case "status":
    case "name":
      return col;
    default:
      return "created_at";
  }
}

export function buildContactListWhere(params: ContactListParams): SQL | undefined {
  const filters: SQL[] = [];

  if (params.search && params.search.trim()) {
    const q = `%${params.search.trim()}%`;
    filters.push(
      sql`
        (
          ${contact_messages.name} LIKE ${q}
          OR ${contact_messages.email} LIKE ${q}
          OR ${contact_messages.phone} LIKE ${q}
          OR ${contact_messages.subject} LIKE ${q}
          OR ${contact_messages.message} LIKE ${q}
        )
      `,
    );
  }

  if (params.status) {
    filters.push(eq(contact_messages.status, params.status));
  }

  if (typeof params.resolved === "boolean") {
    filters.push(eq(contact_messages.is_resolved, params.resolved));
  }

  return filters.length > 0 ? and(...filters) : undefined;
}

export function buildContactOrderExpr(orderBy?: string, order: string = "desc") {
  const resolvedOrderBy = resolveContactOrderBy(orderBy);
  const resolvedOrder: ContactOrder = order.toLowerCase() === "asc" ? "asc" : "desc";

  if (resolvedOrderBy === "created_at") {
    return resolvedOrder === "asc"
      ? asc(contact_messages.created_at)
      : desc(contact_messages.created_at);
  }

  if (resolvedOrderBy === "updated_at") {
    return resolvedOrder === "asc"
      ? asc(contact_messages.updated_at)
      : desc(contact_messages.updated_at);
  }

  if (resolvedOrderBy === "status") {
    return resolvedOrder === "asc"
      ? asc(contact_messages.status)
      : desc(contact_messages.status);
  }

  return resolvedOrder === "asc"
    ? asc(contact_messages.name)
    : desc(contact_messages.name);
}

export function buildContactInsert(
  body: ContactCreateInput & { ip?: string | null; user_agent?: string | null },
  id: string,
): ContactInsert {
  return {
    id,
    name: body.name.trim(),
    email: body.email.trim(),
    phone: body.phone.trim(),
    subject: body.subject.trim(),
    message: body.message,
    status: "new",
    is_resolved: false,
    admin_note: null,
    ip: body.ip ?? null,
    user_agent: body.user_agent ?? null,
    website: body.website ?? null,
  };
}

export function buildContactPatch(body: ContactUpdateInput): Partial<ContactInsert> {
  const patch: Partial<ContactInsert> = {};

  if (body.status) {
    patch.status = body.status;
  }
  if (typeof body.is_resolved === "boolean") {
    patch.is_resolved = body.is_resolved;
  }
  if (typeof body.admin_note !== "undefined") {
    patch.admin_note = body.admin_note ?? null;
  }

  return patch;
}
