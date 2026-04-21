// =============================================================
// FILE: src/integrations/shared/popups/popup-config.ts
// Config helpers for popups admin module
// =============================================================

import type { PopupDto, PopupType, PopupTextBehavior, PopupLinkTarget, PopupDisplayFrequency } from './popup-types';

/** Admin API base path */
export const POPUPS_ADMIN_BASE = '/admin/popups';

/** Default locale fallback */
export const POPUP_DEFAULT_LOCALE = 'tr';

/** Popup type options */
export const POPUP_TYPE_OPTIONS: PopupType[] = ['topbar', 'sidebar_top', 'sidebar_center', 'sidebar_bottom'];

/** Text behavior options */
export const POPUP_TEXT_BEHAVIOR_OPTIONS: PopupTextBehavior[] = ['static', 'marquee'];

/** Link target options */
export const POPUP_LINK_TARGET_OPTIONS: PopupLinkTarget[] = ['_self', '_blank'];

/** Display frequency options */
export const POPUP_DISPLAY_FREQUENCY_OPTIONS: PopupDisplayFrequency[] = ['always', 'once', 'daily'];

/** Detail page tab keys */
export type PopupDetailTabKey = 'content' | 'styling' | 'behavior' | 'seo';

/** Form state for create/edit */
export type PopupDetailFormState = {
  locale: string;
  type: PopupType;
  title: string;
  content: string;
  background_color: string;
  text_color: string;
  button_text: string;
  button_color: string;
  button_hover_color: string;
  button_text_color: string;
  link_url: string;
  link_target: PopupLinkTarget;
  target_paths: string;
  image_url: string;
  image_asset_id: string;
  alt: string;
  text_behavior: PopupTextBehavior;
  scroll_speed: number;
  closeable: boolean;
  delay_seconds: number;
  display_frequency: PopupDisplayFrequency;
  is_active: boolean;
  display_order: number;
  start_at: string;
  end_at: string;
};

/** Create empty form state */
export function createEmptyPopupDetailForm(locale: string): PopupDetailFormState {
  return {
    locale,
    type: 'topbar',
    title: '',
    content: '',
    background_color: '',
    text_color: '',
    button_text: '',
    button_color: '',
    button_hover_color: '',
    button_text_color: '',
    link_url: '',
    link_target: '_self',
    target_paths: '',
    image_url: '',
    image_asset_id: '',
    alt: '',
    text_behavior: 'marquee',
    scroll_speed: 60,
    closeable: true,
    delay_seconds: 0,
    display_frequency: 'always',
    is_active: true,
    display_order: 0,
    start_at: '',
    end_at: '',
  };
}

/** Map backend DTO to form state */
export function mapPopupToDetailForm(dto: PopupDto, locale: string): PopupDetailFormState {
  return {
    locale,
    type: dto.type ?? 'topbar',
    title: dto.title ?? '',
    content: dto.content ?? '',
    background_color: dto.background_color ?? '',
    text_color: dto.text_color ?? '',
    button_text: dto.button_text ?? '',
    button_color: dto.button_color ?? '',
    button_hover_color: dto.button_hover_color ?? '',
    button_text_color: dto.button_text_color ?? '',
    link_url: dto.link_url ?? '',
    link_target: dto.link_target ?? '_self',
    target_paths: Array.isArray(dto.target_paths) ? dto.target_paths.join('\n') : '',
    image_url: dto.image_url ?? '',
    image_asset_id: dto.image_asset_id ?? '',
    alt: dto.alt ?? '',
    text_behavior: dto.text_behavior ?? 'marquee',
    scroll_speed: dto.scroll_speed ?? 60,
    closeable: dto.closeable ?? true,
    delay_seconds: dto.delay_seconds ?? 0,
    display_frequency: dto.display_frequency ?? 'always',
    is_active: dto.is_active ?? true,
    display_order: dto.display_order ?? 0,
    start_at: dto.start_at ?? '',
    end_at: dto.end_at ?? '',
  };
}

/** Build query params for list */
export function buildPopupsListQueryParams(opts: {
  search?: string;
  locale?: string;
  type?: string;
  isActive?: boolean;
}): Record<string, string> {
  const p: Record<string, string> = {};
  if (opts.search) p.q = opts.search;
  if (opts.locale) p.locale = opts.locale;
  if (opts.type) p.type = opts.type;
  if (opts.isActive) p.is_active = '1';
  p.sort = 'display_order';
  p.order = 'asc';
  p.limit = '100';
  return p;
}

/** Build toast message */
export function buildPopupToastMessage(title: string, action: string): string {
  return `${title} — ${action}`;
}

/** Parse target_paths string to array */
export function parseTargetPaths(raw: string): string[] {
  return raw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}
