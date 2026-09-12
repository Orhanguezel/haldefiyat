import { z } from 'zod';
import type { Pool } from 'mysql2/promise';
import { realListingSql } from '../listings/evidence-policy';

export const listingQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(24),
  offset: z.coerce.number().int().min(0).default(0),
  id: z.coerce.number().int().positive().optional(),
  q: z.string().trim().max(160).optional(),
  sponsored: z.enum(['true', 'false']).optional(),
  sort: z.enum(['newest', 'popular']).default('newest'),
});
export function listingImageUrl(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  try { const u = new URL(value, 'https://haldefiyat.com'); return u.protocol === 'https:' ? u.href : null; } catch { return null; }
}
const iso = (v: any) => v == null ? null : new Date(v).toISOString();
export function listingItem(row: any, images: any[]) {
  const gallery = images.map(image => ({ url: listingImageUrl(image.url), order: Number(image.display_order) }))
    .filter((image): image is { url: string; order: number } => Boolean(image.url));
  return {
    id: String(row.id), kind: 'listing', content_type: 'listing', slug: row.slug,
    title: row.title, excerpt: row.description, product_name: row.product_name,
    url: `https://haldefiyat.com/ilan/${encodeURIComponent(row.slug)}`,
    image_url: gallery[0]?.url ?? null, images: gallery, image_urls: gallery.map(i => i.url),
    listing_type: row.listing_type, category: row.category_slug,
    quantity: row.quantity == null ? null : Number(row.quantity), quantity_unit: row.quantity_unit,
    price_type: row.price_type,
    // A negotiation/index quote must never become a fixed advertised price.
    price: row.price_type === 'sabit' && row.price_min != null ? Number(row.price_min) : null,
    price_min: row.price_type === 'sabit' && row.price_min != null ? Number(row.price_min) : null,
    price_max: row.price_type === 'sabit' && row.price_max != null ? Number(row.price_max) : null,
    price_unit: row.price_unit, currency: row.currency,
    city: row.city_slug, district: row.district_slug,
    location: [row.city_slug, row.district_slug].filter(Boolean).join(' / '),
    status: 'approved', valid_until: iso(row.valid_until)?.slice(0, 10),
    is_sponsored: Number(row.sponsored_now) === 1, sponsored_until: iso(row.featured_until),
    published_at: iso(row.created_at), updated_at: iso(row.updated_at),
    popularity: Number(row.view_count || 0),
  };
}
export async function readListingContent(pool: Pick<Pool, 'query'>, input: unknown) {
  const q = listingQuerySchema.parse(input);
  const sponsored = '(l.is_featured=1 AND l.featured_until IS NOT NULL AND l.featured_until>UTC_TIMESTAMP())';
  const where = ["l.status='approved'", 'l.valid_until>=DATE(UTC_TIMESTAMP()+INTERVAL 3 HOUR)', 'l.is_suspicious=0', realListingSql('l')];
  const args: any[] = [];
  if (q.id) { where.push('l.id=?'); args.push(q.id); }
  if (q.q) { where.push('(l.title LIKE ? OR l.product_name LIKE ?)'); args.push(`%${q.q}%`, `%${q.q}%`); }
  if (q.sponsored) where.push(q.sponsored === 'true' ? sponsored : `NOT ${sponsored}`);
  const condition = where.join(' AND ');
  const [[counts], [rows]] = await Promise.all([
    pool.query<any[]>(`SELECT COUNT(*) total FROM hf_listings l WHERE ${condition}`, args),
    pool.query<any[]>(`SELECT l.id,l.slug,l.title,l.description,l.product_name,l.category_slug,l.listing_type,l.quantity,l.quantity_unit,l.price_type,l.price_min,l.price_max,l.price_unit,l.currency,l.city_slug,l.district_slug,l.valid_until,l.featured_until,l.created_at,l.updated_at,l.view_count,${sponsored} sponsored_now FROM hf_listings l WHERE ${condition} ORDER BY ${q.sort === 'popular' ? 'l.view_count DESC' : 'l.created_at DESC'},l.id DESC LIMIT ? OFFSET ?`, [...args,q.limit,q.offset]),
  ]);
  const ids = rows.map(r => r.id);
  const [images] = ids.length ? await pool.query<any[]>(`SELECT listing_id,url,display_order,id FROM hf_listing_images WHERE listing_id IN (${ids.map(() => '?').join(',')}) ORDER BY listing_id,display_order,id`, ids) : [[]];
  const total = Number(counts[0]?.total || 0);
  return { items: rows.map(r => listingItem(r, images.filter(i => i.listing_id === r.id))), total, hasMore: q.offset + rows.length < total };
}
