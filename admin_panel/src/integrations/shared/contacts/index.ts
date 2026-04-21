export {
  CONTACTS_ADMIN_BASE,
  type Contact,
  type ContactCreatePayload,
  type ContactDto,
  type ContactListQueryParams,
  type ContactStatus,
  type ContactUpdatePayload,
  type ContactView,
  normalizeContact,
} from '@/integrations/shared/contacts';

export {
  ADMIN_CONTACTS_DEFAULT_FILTERS,
  ADMIN_CONTACTS_ORDER_BY_OPTIONS,
  ADMIN_CONTACTS_ORDER_OPTIONS,
  ADMIN_CONTACTS_STATUS_OPTIONS,
  type AdminContactsEditState,
  type AdminContactsFilters,
  type AdminContactsOrder,
  type AdminContactsOrderBy,
  buildAdminContactsListParams,
  createAdminContactEditState,
  formatAdminContactDateYmd,
  getAdminContactStatusKey,
  getAdminContactStatusVariant,
} from '@/integrations/shared/contacts-ui';
