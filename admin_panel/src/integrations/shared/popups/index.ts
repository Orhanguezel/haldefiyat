// =============================================================
// FILE: src/integrations/shared/popups/index.ts
// Explicit barrel for popups shared module
// =============================================================

export {
  type PopupType,
  type PopupTextBehavior,
  type PopupLinkTarget,
  type PopupDisplayFrequency,
  type PopupDto,
  type PopupListQueryParams,
  type PopupCreatePayload,
  type PopupUpdatePayload,
  type PopupReorderPayload,
  type PopupSetStatusPayload,
} from './popup-types';

export {
  POPUPS_ADMIN_BASE,
  POPUP_DEFAULT_LOCALE,
  POPUP_TYPE_OPTIONS,
  POPUP_TEXT_BEHAVIOR_OPTIONS,
  POPUP_LINK_TARGET_OPTIONS,
  POPUP_DISPLAY_FREQUENCY_OPTIONS,
  type PopupDetailTabKey,
  type PopupDetailFormState,
  createEmptyPopupDetailForm,
  mapPopupToDetailForm,
  buildPopupsListQueryParams,
  buildPopupToastMessage,
  parseTargetPaths,
} from './popup-config';
