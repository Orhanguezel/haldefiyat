// src/modules/dealerFinance/dealer-catalog.repository.ts
import { and, asc, count, eq, inArray, like, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import { env } from '../../core/env';
import { products, productI18n } from '../products/schema';
import { categories, categoryI18n } from '@agro/shared-backend/modules/categories/schema';
import { subCategories, subCategoryI18n } from '@agro/shared-backend/modules/subcategories/schema';
import { normalizeProduct } from '@agro/shared-backend/modules/products/helpers.shared';

type CatalogParams = {
  locale: string;
  limit: number;
  offset: number;
  q?: string;
  discountPercent: number;
};

function catalogConds(locale: string, q?: string) {
  const allowedItemTypes = env.DEALER_CATALOG_ITEM_TYPES;
  const c = [
    eq(productI18n.locale, locale),
    inArray(products.item_type, allowedItemTypes as unknown as never[]),
    eq(products.is_active, 1 as never),
  ];
  if (q?.trim()) c.push(like(productI18n.title, `%${q.trim()}%`));
  return and(...c);
}

export async function repoCountDealerCatalog(locale: string, q?: string) {
  const whereExpr = catalogConds(locale, q);
  const [row] = await db
    .select({ n: count() })
    .from(products)
    .innerJoin(productI18n, eq(productI18n.product_id, products.id))
    .where(whereExpr);
  return Number(row?.n ?? 0);
}

export async function repoListDealerCatalog(params: CatalogParams) {
  const { locale, limit, offset, q, discountPercent } = params;
  const rate = Math.min(99.99, Math.max(0, discountPercent));
  const factor = 1 - rate / 100;
  const whereExpr = catalogConds(locale, q);

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
    .where(whereExpr)
    .orderBy(asc(products.order_num), asc(products.id))
    .limit(limit)
    .offset(offset);

  return rows.map((r) => {
    const merged = { ...r.p, ...r.i };
    let rest: Record<string, unknown>;
    try {
      const norm = normalizeProduct(merged) as Record<string, unknown>;
      const { price: _omit, ...out } = norm;
      rest = out;
    } catch {
      const { price: _p, ...out } = merged as Record<string, unknown>;
      rest = out;
    }
    const list = parseFloat(String(r.p.price ?? '0'));
    const unit = list * factor;
    return {
      ...rest,
      category: r.c,
      sub_category: r.s,
      list_price: list.toFixed(2),
      unit_price: unit.toFixed(2),
      discount_percent: rate,
    };
  });
}
