// =============================================================
// FILE: src/integrations/shared/popups/popup-types.ts
// Types for the popups CRUD module (INTEGER ids, i18n)
// =============================================================

export type PopupType = 'topbar' | 'sidebar_top' | 'sidebar_center' | 'sidebar_bottom';
export type PopupTextBehavior = 'static' | 'marquee';
export type PopupLinkTarget = '_self' | '_blank';
export type PopupDisplayFrequency = 'always' | 'once' | 'daily';

/** Admin list/detail DTO (returned by backend admin endpoints) */
export type PopupDto = {
  id: number;
  uuid: string;
  type: PopupType;

  title: string;
  content: string | null;

  background_color: string | null;
  text_color: string | null;

  button_text: string | null;
  button_color: string | null;
  button_hover_color: string | null;
  button_text_color: string | null;

  link_url: string | null;
  link_target: PopupLinkTarget;
  target_paths: string[];

  image_url: string | null;
  image_asset_id: string | null;
  alt: string | null;

  text_behavior: PopupTextBehavior;
  scroll_speed: number;

  closeable: boolean;
  delay_seconds: number;
  display_frequency: PopupDisplayFrequency;

  is_active: boolean;
  display_order: number;

  start_at: string | null;
  end_at: string | null;

  created_at: string;
  updated_at: string;
};

/** Query params for admin list */
export type PopupListQueryParams = {
  type?: PopupType;
  q?: string;
  is_active?: boolean;
  limit?: number;
  offset?: number;
  sort?: 'display_order' | 'created_at' | 'updated_at';
  order?: 'asc' | 'desc';
  locale?: string;
  default_locale?: string;
};

/** Body for POST /admin/popups */
export type PopupCreatePayload = {
  locale?: string;
  type?: PopupType;
  title: string;
  content?: string | null;
  background_color?: string | null;
  text_color?: string | null;
  button_text?: string | null;
  button_color?: string | null;
  button_hover_color?: string | null;
  button_text_color?: string | null;
  link_url?: string | null;
  link_target?: PopupLinkTarget;
  target_paths?: string[];
  image_url?: string | null;
  image_asset_id?: string | null;
  alt?: string | null;
  text_behavior?: PopupTextBehavior;
  scroll_speed?: number;
  closeable?: boolean;
  delay_seconds?: number;
  display_frequency?: PopupDisplayFrequency;
  is_active?: boolean;
  display_order?: number;
  start_at?: string | null;
  end_at?: string | null;
};

/** Body for PATCH /admin/popups/:id */
export type PopupUpdatePayload = Partial<PopupCreatePayload>;

/** Body for POST /admin/popups/reorder */
export type PopupReorderPayload = {
  ids: number[];
};

/** Body for PATCH /admin/popups/:id/status */
export type PopupSetStatusPayload = {
  is_active: boolean;
};
