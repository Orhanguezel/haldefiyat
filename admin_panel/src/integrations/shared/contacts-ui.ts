import type { ContactListQueryParams, ContactStatus, ContactView } from '@/integrations/shared/contacts';
import type { VariantProps } from 'class-variance-authority';
import type { badgeVariants } from '@/components/ui/badge';

export type AdminContactsOrderBy = NonNullable<ContactListQueryParams['orderBy']>;
export type AdminContactsOrder = NonNullable<ContactListQueryParams['order']>;

export type AdminContactsFilters = {
  search: string;
  status: '' | ContactStatus;
  onlyUnresolved: boolean;
  orderBy: AdminContactsOrderBy;
  order: AdminContactsOrder;
};

export type AdminContactsEditState = {
  id: string;
  status: ContactStatus;
  is_resolved: boolean;
  admin_note: string;
};

export const ADMIN_CONTACTS_DEFAULT_FILTERS: AdminContactsFilters = {
  search: '',
  status: '',
  onlyUnresolved: false,
  orderBy: 'created_at',
  order: 'desc',
};

export const ADMIN_CONTACTS_STATUS_OPTIONS = [
  { value: 'new', labelKey: 'statusNew' },
  { value: 'in_progress', labelKey: 'statusInProgress' },
  { value: 'closed', labelKey: 'statusClosed' },
] as const;

export const ADMIN_CONTACTS_ORDER_BY_OPTIONS = [
  { value: 'created_at', labelKey: 'orderByCreated' },
  { value: 'updated_at', labelKey: 'orderByUpdated' },
  { value: 'status', labelKey: 'orderByStatus' },
  { value: 'name', labelKey: 'orderByName' },
] as const;

export const ADMIN_CONTACTS_ORDER_OPTIONS = [
  { value: 'desc', labelKey: 'orderDesc' },
  { value: 'asc', labelKey: 'orderAsc' },
] as const;

export function buildAdminContactsListParams(
  filters: AdminContactsFilters,
): ContactListQueryParams {
  return {
    search: filters.search.trim() || undefined,
    status: filters.status || undefined,
    resolved: filters.onlyUnresolved ? false : undefined,
    orderBy: filters.orderBy,
    order: filters.order,
    limit: 200,
    offset: 0,
  };
}

export function createAdminContactEditState(item: ContactView): AdminContactsEditState {
  return {
    id: item.id,
    status: item.status,
    is_resolved: !!item.is_resolved,
    admin_note: item.admin_note ?? '',
  };
}

export function formatAdminContactDateYmd(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value.slice(0, 10);
  if (value instanceof Date && typeof value.toISOString === 'function') {
    return value.toISOString().slice(0, 10);
  }

  return '';
}

export function getAdminContactStatusKey(status: ContactStatus): 'new' | 'inProgress' | 'closed' {
  if (status === 'new') return 'new';
  if (status === 'in_progress') return 'inProgress';
  return 'closed';
}

export function getAdminContactStatusVariant(
  status: ContactStatus,
): VariantProps<typeof badgeVariants>['variant'] {
  if (status === 'new') return 'secondary';
  if (status === 'in_progress') return 'default';
  return 'outline';
}
