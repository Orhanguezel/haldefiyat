// src/modules/slider/helpers/map.ts
import type { RowWithAsset } from '../repository';

export type SlidePublicData = {
  id: string;
  title: string;
  description: string;
  image: string;
  alt?: string;
  buttonText: string;
  buttonLink: string;
  isActive: boolean;
  order: number;
  priority?: 'low' | 'medium' | 'high';
  showOnMobile?: boolean;
  showOnDesktop?: boolean;
  locale: string;
};

export function rowToPublic(row: RowWithAsset): SlidePublicData {
  const base = row.sl;
  const t = row.i18n;
  const url = row.asset_url ?? base.image_url ?? '';

  return {
    id: String(base.id),
    title: t.name,
    description: t.description ?? '',
    image: url ?? '',
    alt: t.alt ?? undefined,
    buttonText: t.buttonText ?? '',
    buttonLink: t.buttonLink ?? '',
    isActive: !!base.is_active,
    order: base.display_order ?? 0,
    priority: base.featured ? 'high' : 'medium',
    showOnMobile: true,
    showOnDesktop: true,
    locale: t.locale,
  };
}

export function toAdminView(row: RowWithAsset) {
  const base = row.sl;
  const t = row.i18n;

  return {
    id: base.id,
    uuid: base.uuid,

    locale: t.locale,
    name: t.name,
    slug: t.slug,
    description: t.description ?? null,

    image_url: base.image_url ?? null,
    image_asset_id: base.image_asset_id ?? null,
    image_effective_url: row.asset_url ?? base.image_url ?? null,

    alt: t.alt ?? null,
    buttonText: t.buttonText ?? null,
    buttonLink: t.buttonLink ?? null,

    featured: !!base.featured,
    is_active: !!base.is_active,
    display_order: base.display_order,

    created_at: base.created_at,
    updated_at: base.updated_at,
  };
}
