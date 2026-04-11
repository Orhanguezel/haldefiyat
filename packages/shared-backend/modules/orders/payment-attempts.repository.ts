import type { RowDataPacket } from 'mysql2/promise';
import { pool } from '../../db/client';

export type PaymentAttemptListParams = {
  limit: number;
  offset: number;
  order_id?: string;
  provider?: string;
  status?: string;
  payment_ref?: string;
  date_from?: string;
  date_to?: string;
};

function buildWhere(params: Omit<PaymentAttemptListParams, 'limit' | 'offset'>) {
  const clauses: string[] = [];
  const values: unknown[] = [];

  if (params.order_id) {
    clauses.push('pa.order_id = ?');
    values.push(params.order_id);
  }
  if (params.provider) {
    clauses.push('pa.provider = ?');
    values.push(params.provider);
  }
  if (params.status) {
    clauses.push('pa.status = ?');
    values.push(params.status);
  }
  if (params.payment_ref) {
    clauses.push('pa.payment_ref = ?');
    values.push(params.payment_ref);
  }
  if (params.date_from) {
    clauses.push('pa.created_at >= ?');
    values.push(params.date_from);
  }
  if (params.date_to) {
    clauses.push('pa.created_at <= ?');
    values.push(params.date_to);
  }

  return {
    sql: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '',
    values,
  };
}

export async function repoListPaymentAttempts(params: PaymentAttemptListParams) {
  const where = buildWhere(params);
  const [rows] = await pool.execute<RowDataPacket[]>(
    `
      SELECT
        pa.id,
        pa.order_id,
        pa.payment_ref,
        pa.provider,
        pa.status,
        pa.amount,
        pa.request_payload,
        pa.response_payload,
        pa.callback_payload,
        pa.last_error,
        pa.created_at,
        pa.updated_at,
        o.status AS order_status,
        o.payment_status AS order_payment_status,
        o.payment_method AS order_payment_method
      FROM payment_attempts pa
      INNER JOIN orders o ON o.id = pa.order_id
      ${where.sql}
      ORDER BY pa.created_at DESC
      LIMIT ? OFFSET ?
    `,
    ([...where.values, params.limit, params.offset] as any),
  );
  return rows;
}

export async function repoCountPaymentAttempts(
  params: Omit<PaymentAttemptListParams, 'limit' | 'offset'>,
) {
  const where = buildWhere(params);
  const [rows] = await pool.execute<RowDataPacket[]>(
    `
      SELECT COUNT(*) AS total
      FROM payment_attempts pa
      ${where.sql}
    `,
    (where.values as any),
  );
  return Number(rows[0]?.total ?? 0);
}

export async function repoGetPaymentAttemptByRef(paymentRef: string) {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `
      SELECT
        pa.*,
        o.status AS order_status,
        o.payment_status AS order_payment_status,
        o.payment_method AS order_payment_method,
        o.total AS order_total,
        o.dealer_id
      FROM payment_attempts pa
      INNER JOIN orders o ON o.id = pa.order_id
      WHERE pa.payment_ref = ?
      LIMIT 1
    `,
    ([paymentRef] as any),
  );
  return rows[0] ?? null;
}
