// =============================================================
// FILE: src/integrations/shared/support/support-types.ts
// =============================================================

export type FaqCategory = 'genel' | 'urunler' | 'hesap' | 'teknik';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface SupportFaqDto {
  id: string;
  category: FaqCategory;
  display_order: number;
  is_published: boolean;
  question: string;
  answer: string;
  locale: string;
  created_at: string;
  updated_at: string;
}

export interface SupportFaqListQueryParams {
  locale?: string;
  category?: FaqCategory;
  is_published?: boolean;
  limit?: number;
  offset?: number;
}

export interface SupportFaqCreatePayload {
  locale?: string;
  question: string;
  answer: string;
  category?: FaqCategory;
  is_published?: boolean;
  display_order?: number;
}

export type SupportFaqUpdatePayload = Partial<SupportFaqCreatePayload> & { locale: string };

export interface SupportFaqReorderItem {
  id: string;
  display_order: number;
}

export interface SupportFaqReorderPayload {
  items: SupportFaqReorderItem[];
}

export interface SupportTicketDto {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  subject: string;
  message: string;
  category: string;
  status: TicketStatus;
  priority: TicketPriority;
  admin_note: string | null;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupportTicketListQueryParams {
  status?: TicketStatus;
  category?: FaqCategory;
  priority?: TicketPriority;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface SupportTicketUpdatePayload {
  status?: TicketStatus;
  priority?: TicketPriority;
  admin_note?: string;
}
