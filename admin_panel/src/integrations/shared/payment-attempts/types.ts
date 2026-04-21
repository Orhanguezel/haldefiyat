export type PaymentAttemptStatus = 'pending' | 'succeeded' | 'failed' | 'expired';

export interface PaymentAttemptDto {
  id: string;
  order_id: string;
  payment_ref: string;
  provider: string;
  status: PaymentAttemptStatus;
  amount: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
  order_status: string | null;
  order_payment_status: string | null;
  order_payment_method: string | null;
}

export interface PaymentAttemptListResponse {
  data: PaymentAttemptDto[];
  total: number;
  limit: number;
  offset: number;
}

export interface PaymentAttemptListQuery {
  limit?: number;
  offset?: number;
  provider?: string;
  status?: string;
  q?: string;
}
