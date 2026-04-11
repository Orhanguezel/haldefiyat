import { db } from '../../db/client';
import { and, asc, desc, eq, sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { popups, popupsI18n, type PopupRow } from "./schema";
import { storageAssets } from "@agro/shared-backend/modules/storage/schema";
import { publicUrlOf, toBool } from "@agro/shared-backend/modules/_shared";
import { randomUUID } from "node:crypto";
import type {
  AdminListQuery,
  CreateBody,
  PublicListQuery,
  UpdateBody,
} from "./validation";

export type PopupResolvedI18n = {
  locale: string | null;
  title: string;
  content: string | null;
  button_text: string | null;
  alt: string | null;
};

export type PopupTargetPath = {
  target_paths: string[];
};

export type PopupWithAsset = {
  row: Omit<PopupRow, "target_paths"> & PopupTargetPath;
  i18n: PopupResolvedI18n;
  image_url: string | null;
};

function normalizePath(raw: string): string {
  const trimmed = String(raw || "").trim();
  if (!trimmed) return "";
  const noQuery = trimmed.split("?")[0]?.split("#")[0] ?? "";
  if (!noQuery) return "";
  const withSlash = noQuery.startsWith("/") ? noQuery : `/${noQuery}`;
  return withSlash.replace(/\/{2,}/g, "/").replace(/\/+$/g, "") || "/";
}

function parseTargetPaths(raw: unknown): string[] {
  if (!raw) return [];

  if (Array.isArray(raw)) {
    return Array.from(new Set(raw.map((v) => normalizePath(String(v))).filter(Boolean)));
  }

  if (typeof raw === "string") {
    const s = raw.trim();
    if (!s) return [];
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) return parseTargetPaths(parsed);
    } catch {
      // ignore and fallback to newline/comma parsing
    }
    return Array.from(
      new Set(
        s
          .split(/[\n,]+/)
          .map((v) => normalizePath(v))
          .filter(Boolean),
      ),
    );
  }

  return [];
}

function serializeTargetPaths(paths: string[] | undefined): string | null {
  const normalized = parseTargetPaths(paths ?? []);
  return normalized.length ? JSON.stringify(normalized) : null;
}

function matchesTargetPath(popupTargets: string[], currentPath?: string): boolean {
  if (!popupTargets.length) return true;
  const current = normalizePath(currentPath || "");
  if (!current) return false;

  return popupTargets.some((target) => {
    if (!target) return false;
    if (target.endsWith("/*")) {
      const base = target.slice(0, -2) || "/";
      return current === base || current.startsWith(`${base}/`);
    }
    return current === target;
  });
}

function isWithinSchedule(
  row: Pick<PopupRow, "start_at" | "end_at">,
  now: Date,
): boolean {
  const startAt = row.start_at ? new Date(row.start_at) : null;
  const endAt = row.end_at ? new Date(row.end_at) : null;

  if (startAt && !Number.isNaN(startAt.getTime()) && startAt.getTime() > now.getTime()) return false;
  if (endAt && !Number.isNaN(endAt.getTime()) && endAt.getTime() < now.getTime()) return false;
  return true;
}

const ORDER = {
  display_order: popups.display_order,
  created_at: popups.created_at,
  updated_at: popups.updated_at,
} as const;

function orderExpr(sort: keyof typeof ORDER, dir: "asc" | "desc") {
  const col = ORDER[sort] ?? ORDER.display_order;
  return dir === "asc" ? asc(col) : desc(col);
}

function baseSelect(locale: string, defaultLocale: string) {
  const iReq = alias(popupsI18n, "pi_req");
  const iDef = alias(popupsI18n, "pi_def");

  return db
    .select({
      row: popups,
      title_resolved: sql<string>`COALESCE(${iReq.title}, ${iDef.title}, ${popups.title})`,
      content_resolved: sql<string>`COALESCE(${iReq.content}, ${iDef.content}, ${popups.content})`,
      button_text_resolved: sql<string>`COALESCE(${iReq.button_text}, ${iDef.button_text}, ${popups.button_text})`,
      alt_resolved: sql<string>`COALESCE(${iReq.alt}, ${iDef.alt}, ${popups.alt})`,
      locale_resolved: sql<string>`
        CASE
          WHEN ${iReq.id} IS NOT NULL THEN ${iReq.locale}
          WHEN ${iDef.id} IS NOT NULL THEN ${iDef.locale}
          ELSE NULL
        END
      `,
      asset_bucket: storageAssets.bucket,
      asset_path: storageAssets.path,
      asset_url0: storageAssets.url,
    })
    .from(popups)
    .leftJoin(iReq, and(eq(iReq.popup_id, popups.id), eq(iReq.locale, locale)))
    .leftJoin(iDef, and(eq(iDef.popup_id, popups.id), eq(iDef.locale, defaultLocale)))
    .leftJoin(storageAssets, eq(popups.image_asset_id, storageAssets.id));
}

function toWithAsset(r: {
  row: PopupRow;
  title_resolved: string;
  content_resolved: string | null;
  button_text_resolved: string | null;
  alt_resolved: string | null;
  locale_resolved: string | null;
  asset_bucket: string | null;
  asset_path: string | null;
  asset_url0: string | null;
}): PopupWithAsset {
  const target_paths = parseTargetPaths((r.row as any).target_paths);
  return {
    row: {
      ...r.row,
      target_paths,
    },
    i18n: {
      locale: r.locale_resolved,
      title: r.title_resolved,
      content: r.content_resolved ?? null,
      button_text: r.button_text_resolved ?? null,
      alt: r.alt_resolved ?? null,
    },
    image_url: publicUrlOf(r.asset_bucket, r.asset_path, r.asset_url0) ?? r.row.image_url ?? null,
  };
}

function searchFilter(raw: string | undefined, iReq: any, iDef: any) {
  if (!raw || !raw.trim()) return null;
  const q = `%${raw.trim()}%`;

  return sql`(
    COALESCE(${iReq.title}, ${iDef.title}, ${popups.title}) LIKE ${q}
    OR COALESCE(${iReq.content}, ${iDef.content}, ${popups.content}) LIKE ${q}
  )`;
}

async function upsertPopupI18n(
  popupId: number,
  locale: string,
  patch: {
    title?: string;
    content?: string | null;
    button_text?: string | null;
    alt?: string | null;
  },
) {
  const existing = await db
    .select({ id: popupsI18n.id, title: popupsI18n.title })
    .from(popupsI18n)
    .where(and(eq(popupsI18n.popup_id, popupId), eq(popupsI18n.locale, locale)))
    .limit(1);

  if (existing.length) {
    const set: Record<string, unknown> = { updated_at: sql`CURRENT_TIMESTAMP(3)` };
    if (typeof patch.title !== "undefined") set.title = patch.title;
    if (typeof patch.content !== "undefined") set.content = patch.content ?? null;
    if (typeof patch.button_text !== "undefined") set.button_text = patch.button_text ?? null;
    if (typeof patch.alt !== "undefined") set.alt = patch.alt ?? null;

    await db.update(popupsI18n).set(set as any).where(eq(popupsI18n.id, existing[0].id));
    return;
  }

  if (!patch.title || !patch.title.trim()) return;

  await db.insert(popupsI18n).values({
    popup_id: popupId,
    locale,
    title: patch.title.trim(),
    content: typeof patch.content === "undefined" ? null : patch.content ?? null,
    button_text: typeof patch.button_text === "undefined" ? null : patch.button_text ?? null,
    alt: typeof patch.alt === "undefined" ? null : patch.alt ?? null,
  } as any);
}

/* ===================== PUBLIC ===================== */

export async function repoListPublic(
  q: PublicListQuery & { locale: string; default_locale: string },
): Promise<PopupWithAsset[]> {
  const iReq = alias(popupsI18n, "pi_req");
  const iDef = alias(popupsI18n, "pi_def");

  const conds: SQL[] = [eq(popups.is_active, 1 as const)];
  if (q.type) conds.push(eq(popups.type, q.type));

  const textFilter = searchFilter(q.q, iReq, iDef);
  if (textFilter) conds.push(textFilter);

  const rows = await baseSelect(q.locale, q.default_locale)
    .where(and(...conds))
    .orderBy(orderExpr(q.sort, q.order), asc(popups.display_order), asc(popups.id))
    ;

  const now = new Date();

  return (rows as any[])
    .map(toWithAsset)
    .filter((item) => isWithinSchedule(item.row, now))
    .filter((item) => matchesTargetPath(item.row.target_paths, q.current_path))
    .slice(q.offset, q.offset + q.limit);
}

/* ===================== ADMIN ===================== */

export async function repoListAdmin(
  q: AdminListQuery & { locale: string; default_locale: string },
): Promise<PopupWithAsset[]> {
  const iReq = alias(popupsI18n, "pi_req");
  const iDef = alias(popupsI18n, "pi_def");

  const conds: SQL[] = [];
  if (typeof q.is_active !== "undefined") conds.push(eq(popups.is_active, toBool(q.is_active) ? 1 : 0));
  if (q.type) conds.push(eq(popups.type, q.type));

  const textFilter = searchFilter(q.q, iReq, iDef);
  if (textFilter) conds.push(textFilter);

  const whereExpr = conds.length ? (and(...conds) as SQL) : sql`1=1`;

  const rows = await baseSelect(q.locale, q.default_locale)
    .where(whereExpr)
    .orderBy(orderExpr(q.sort, q.order), asc(popups.display_order), asc(popups.id))
    .limit(q.limit)
    .offset(q.offset);

  return (rows as any[]).map(toWithAsset);
}

export async function repoGetById(
  id: number,
  locale: string,
  defaultLocale: string,
): Promise<PopupWithAsset | null> {
  const rows = await baseSelect(locale, defaultLocale).where(eq(popups.id, id)).limit(1);
  if (!rows.length) return null;
  return toWithAsset(rows[0] as any);
}

export async function repoCreate(
  b: CreateBody,
  locale: string,
  defaultLocale: string,
): Promise<PopupWithAsset> {
  const maxOrder = await db
    .select({ v: sql<number>`COALESCE(MAX(${popups.display_order}), 0)` })
    .from(popups);

  const uuid = randomUUID();

  await db.insert(popups).values({
    uuid,
    type: b.type ?? "topbar",
    title: b.title,
    content: b.content ?? null,
    background_color: b.background_color ?? null,
    text_color: b.text_color ?? null,
    button_text: b.button_text ?? null,
    button_color: b.button_color ?? null,
    button_hover_color: b.button_hover_color ?? null,
    button_text_color: b.button_text_color ?? null,
    link_url: b.link_url ?? null,
    link_target: b.link_target ?? "_self",
    target_paths: serializeTargetPaths(b.target_paths),
    image_url: b.image_url ?? null,
    image_asset_id: b.image_asset_id ?? null,
    alt: b.alt ?? null,
    text_behavior: b.text_behavior ?? "marquee",
    scroll_speed: b.scroll_speed ?? 60,
    closeable: toBool(b.closeable) ? 1 : 0,
    delay_seconds: b.delay_seconds ?? 0,
    display_frequency: b.display_frequency ?? "always",
    is_active: toBool(b.is_active) ? 1 : 0,
    display_order: b.display_order ?? (maxOrder[0]?.v ?? 0) + 1,
    start_at: b.start_at ?? null,
    end_at: b.end_at ?? null,
  } as any);

  const created = await db.select({ id: popups.id }).from(popups).where(eq(popups.uuid, uuid)).limit(1);
  if (!created.length) throw new Error("create_failed");

  const popupId = created[0].id;
  await upsertPopupI18n(popupId, locale, {
    title: b.title,
    content: b.content ?? null,
    button_text: b.button_text ?? null,
    alt: b.alt ?? null,
  });

  if (locale !== defaultLocale) {
    await upsertPopupI18n(popupId, defaultLocale, {
      title: b.title,
      content: b.content ?? null,
      button_text: b.button_text ?? null,
      alt: b.alt ?? null,
    });
  }

  const result = await repoGetById(popupId, locale, defaultLocale);
  if (!result) throw new Error("create_failed");
  return result;
}

export async function repoUpdate(
  id: number,
  b: UpdateBody,
  locale: string,
  defaultLocale: string,
): Promise<PopupWithAsset | null> {
  const set: Record<string, unknown> = { updated_at: sql`CURRENT_TIMESTAMP(3)` };
  if (b.type !== undefined) set.type = b.type;
  if (b.title !== undefined) set.title = b.title;
  if (b.content !== undefined) set.content = b.content ?? null;
  if (b.background_color !== undefined) set.background_color = b.background_color ?? null;
  if (b.text_color !== undefined) set.text_color = b.text_color ?? null;
  if (b.button_text !== undefined) set.button_text = b.button_text ?? null;
  if (b.button_color !== undefined) set.button_color = b.button_color ?? null;
  if (b.button_hover_color !== undefined) set.button_hover_color = b.button_hover_color ?? null;
  if (b.button_text_color !== undefined) set.button_text_color = b.button_text_color ?? null;
  if (b.link_url !== undefined) set.link_url = b.link_url ?? null;
  if (b.link_target !== undefined) set.link_target = b.link_target;
  if (b.target_paths !== undefined) set.target_paths = serializeTargetPaths(b.target_paths);
  if (b.image_url !== undefined) set.image_url = b.image_url ?? null;
  if (b.image_asset_id !== undefined) set.image_asset_id = b.image_asset_id ?? null;
  if (b.alt !== undefined) set.alt = b.alt ?? null;
  if (b.text_behavior !== undefined) set.text_behavior = b.text_behavior;
  if (b.scroll_speed !== undefined) set.scroll_speed = b.scroll_speed;
  if (b.closeable !== undefined) set.closeable = toBool(b.closeable) ? 1 : 0;
  if (b.delay_seconds !== undefined) set.delay_seconds = b.delay_seconds;
  if (b.display_frequency !== undefined) set.display_frequency = b.display_frequency;
  if (b.is_active !== undefined) set.is_active = toBool(b.is_active) ? 1 : 0;
  if (b.display_order !== undefined) set.display_order = b.display_order;
  if (b.start_at !== undefined) set.start_at = b.start_at ?? null;
  if (b.end_at !== undefined) set.end_at = b.end_at ?? null;

  await db.update(popups).set(set as any).where(eq(popups.id, id));

  const hasI18nPatch =
    b.title !== undefined ||
    b.content !== undefined ||
    b.button_text !== undefined ||
    b.alt !== undefined;

  if (hasI18nPatch) {
    await upsertPopupI18n(id, locale, {
      title: b.title,
      content: b.content,
      button_text: b.button_text,
      alt: b.alt,
    });
  }

  return repoGetById(id, locale, defaultLocale);
}

export async function repoDelete(id: number): Promise<void> {
  await db.delete(popups).where(eq(popups.id, id));
}

export async function repoReorder(ids: number[]): Promise<void> {
  for (let i = 0; i < ids.length; i++) {
    await db
      .update(popups)
      .set({ display_order: i + 1, updated_at: sql`CURRENT_TIMESTAMP(3)` } as any)
      .where(eq(popups.id, ids[i]));
  }
}

export async function repoSetStatus(
  id: number,
  isActive: boolean,
  locale: string,
  defaultLocale: string,
): Promise<PopupWithAsset | null> {
  await db
    .update(popups)
    .set({ is_active: isActive ? 1 : 0, updated_at: sql`CURRENT_TIMESTAMP(3)` } as any)
    .where(eq(popups.id, id));

  return repoGetById(id, locale, defaultLocale);
}
