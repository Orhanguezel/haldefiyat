// GET /products/compare?slugs=a,b | ?ids=uuid1,uuid2,...&locale=&item_type=
import type { RouteHandler } from "fastify";
import { and, eq, inArray } from "drizzle-orm";

import { db } from "../../db/client";
import { products, productI18n } from "./schema";
import { categories, categoryI18n } from "../categories/schema";
import { subCategories, subCategoryI18n } from "../subcategories/schema";
import { normalizeProduct, normalizeItemType, publicProductJson, type ItemType } from "./helpers.shared";
import { parseSlugsParam, resolveOrderedIdsFromSlugs } from "./compare.helpers";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const normalizeLocaleFromString = (raw?: string | null, fallback = "tr") => {
  if (!raw) return fallback;
  const trimmed = raw.trim();
  if (!trimmed) return fallback;
  const [short] = trimmed.split("-");
  const norm = (short || fallback).toLowerCase();
  return norm || fallback;
};

function parseIdsParam(ids: string | undefined): string[] | null {
  const raw = String(ids ?? "").trim();
  if (!raw) return null;
  const parts = raw.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
  const uuids = parts.filter((id) => UUID_RE.test(id));
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const id of uuids) {
    if (seen.has(id)) continue;
    seen.add(id);
    ordered.push(id);
  }
  return ordered.length ? ordered : null;
}

export const compareProducts: RouteHandler = async (req, reply) => {
  const q = (req.query || {}) as {
    ids?: string;
    slugs?: string;
    locale?: string;
    item_type?: ItemType;
  };
  const locale = normalizeLocaleFromString(q.locale, "tr");
  const itemType = normalizeItemType(q.item_type, "product");

  const slugParam = parseSlugsParam(q.slugs);
  let idList: string[] | null = null;

  if (slugParam && slugParam.length > 0) {
    if (slugParam.length < 2) {
      return reply.code(400).send({
        error: {
          message: "validation_error",
          detail: "slugs must list at least two valid product slugs (comma-separated)",
        },
      });
    }
    if (slugParam.length > 5) {
      return reply.code(400).send({
        error: { message: "validation_error", detail: "maximum 5 products" },
      });
    }
    idList = await resolveOrderedIdsFromSlugs(slugParam, locale, itemType);
    if (!idList.length || idList.length < 2) {
      return reply.code(400).send({
        error: {
          message: "validation_error",
          detail: "could not resolve at least two products from the given slugs for this locale",
        },
      });
    }
  } else {
    const parsedIds = parseIdsParam(q.ids);
    if (!parsedIds || parsedIds.length < 2) {
      return reply.code(400).send({
        error: {
          message: "validation_error",
          detail: "provide slugs=slug1,slug2 or ids with at least two valid UUIDs",
        },
      });
    }
    if (parsedIds.length > 5) {
      return reply.code(400).send({
        error: { message: "validation_error", detail: "maximum 5 products" },
      });
    }
    idList = parsedIds;
  }

  const rows = await db
    .select({
      p: products,
      i: productI18n,
      c: {
        id: categories.id,
        module_key: categories.module_key,
        image_url: categories.image_url,
        storage_asset_id: categories.storage_asset_id,
        alt: categories.alt,
        icon: categories.icon,
        is_active: categories.is_active,
        is_featured: categories.is_featured,
        display_order: categories.display_order,
        name: categoryI18n.name,
        slug: categoryI18n.slug,
      },
      s: {
        id: subCategories.id,
        category_id: subCategories.category_id,
        image_url: subCategories.image_url,
        storage_asset_id: subCategories.storage_asset_id,
        alt: subCategories.alt,
        icon: subCategories.icon,
        is_active: subCategories.is_active,
        is_featured: subCategories.is_featured,
        display_order: subCategories.display_order,
        name: subCategoryI18n.name,
        slug: subCategoryI18n.slug,
      },
    })
    .from(products)
    .innerJoin(productI18n, eq(productI18n.product_id, products.id))
    .leftJoin(categories, eq(products.category_id, categories.id))
    .leftJoin(
      categoryI18n,
      and(eq(categoryI18n.category_id, categories.id), eq(categoryI18n.locale, locale)),
    )
    .leftJoin(subCategories, eq(products.sub_category_id, subCategories.id))
    .leftJoin(
      subCategoryI18n,
      and(
        eq(subCategoryI18n.sub_category_id, subCategories.id),
        eq(subCategoryI18n.locale, locale),
      ),
    )
    .where(
      and(
        inArray(products.id, idList),
        eq(productI18n.locale, locale),
        eq(products.item_type, itemType as never),
        eq(products.is_active, 1 as never),
      ),
    );

  const byId = new Map(
    rows.map((r) => {
      const merged = { ...r.p, ...r.i };
      return [
        r.p.id,
        publicProductJson({
          ...normalizeProduct(merged),
          category: r.c,
          sub_category: r.s,
        } as Record<string, unknown>),
      ] as const;
    }),
  );

  const data = idList.map((id) => byId.get(id)).filter((x): x is NonNullable<typeof x> => x != null);

  return reply.send({
    data,
    requested: idList.length,
    matched: data.length,
  });
};
