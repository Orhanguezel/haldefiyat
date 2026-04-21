// =============================================================
// FILE: src/integrations/shared/support/support-config.ts
// =============================================================

export const SUPPORT_ADMIN_BASE = '/admin/support';
export const SUPPORT_DEFAULT_LOCALE = 'tr';

export const FAQ_CATEGORY_OPTIONS: Array<{ value: string; labelKey: string }> = [
  { value: 'genel', labelKey: 'faqCategories.genel' },
  { value: 'urunler', labelKey: 'faqCategories.urunler' },
  { value: 'hesap', labelKey: 'faqCategories.hesap' },
  { value: 'teknik', labelKey: 'faqCategories.teknik' },
];

export const TICKET_STATUS_OPTIONS: Array<{ value: string; labelKey: string }> = [
  { value: 'open', labelKey: 'ticketStatuses.open' },
  { value: 'in_progress', labelKey: 'ticketStatuses.in_progress' },
  { value: 'resolved', labelKey: 'ticketStatuses.resolved' },
  { value: 'closed', labelKey: 'ticketStatuses.closed' },
];

export const TICKET_PRIORITY_OPTIONS: Array<{ value: string; labelKey: string }> = [
  { value: 'low', labelKey: 'ticketPriorities.low' },
  { value: 'normal', labelKey: 'ticketPriorities.normal' },
  { value: 'high', labelKey: 'ticketPriorities.high' },
  { value: 'urgent', labelKey: 'ticketPriorities.urgent' },
];

export function getTicketStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'open': return 'default';
    case 'in_progress': return 'secondary';
    case 'resolved': return 'outline';
    case 'closed': return 'destructive';
    default: return 'default';
  }
}

export function getTicketPriorityVariant(priority: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (priority) {
    case 'urgent': return 'destructive';
    case 'high': return 'secondary';
    case 'normal': return 'default';
    case 'low': return 'outline';
    default: return 'default';
  }
}

export function buildSupportFaqsListQueryParams(input: {
  locale?: string;
  category?: string;
  isPublished?: boolean;
}): Record<string, string | boolean> {
  const params: Record<string, string | boolean> = {
    locale: input.locale || SUPPORT_DEFAULT_LOCALE,
  };
  if (input.category) params.category = input.category;
  if (input.isPublished) params.is_published = true;
  return params;
}

export function buildSupportTicketsListQueryParams(input: {
  status?: string;
  category?: string;
  priority?: string;
  search?: string;
}): Record<string, string> {
  const params: Record<string, string> = {};
  if (input.status) params.status = input.status;
  if (input.category) params.category = input.category;
  if (input.priority) params.priority = input.priority;
  if (input.search) params.search = input.search;
  return params;
}
