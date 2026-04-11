import { randomUUID } from 'crypto';
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { pool } from '../../db/client';

export type DealerDirectPaymentRow = {
  id: string;
  dealer_id: string;
  payment_ref: string;
  provider: string;
  status: 'pending' | 'succeeded' | 'failed' | 'expired';
  amount: string;
  note: string | null;
  request_payload: string | null;
  response_payload: string | null;
  callback_payload: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};

function stringifyPayload(payload: unknown): string | null {
  if (payload == null) return null;
  try {
    return JSON.stringify(payload);
  } catch {
    return null;
  }
}

export async function repoCreateDealerDirectPaymentAttempt(params: {
  dealerProfileId: string;
  paymentRef: string;
  provider: string;
  amount: string;
  note: string;
  requestPayload?: unknown;
}) {
  await pool.execute(
    `
      INSERT INTO dealer_direct_payments (
        id, dealer_id, payment_ref, provider, status, amount, note, request_payload, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
    `,
    [
      randomUUID(),
      params.dealerProfileId,
      params.paymentRef,
      params.provider,
      params.amount,
      params.note,
      stringifyPayload(params.requestPayload),
    ],
  );
}

export async function repoGetDealerDirectPaymentByRef(paymentRef: string): Promise<DealerDirectPaymentRow | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT * FROM dealer_direct_payments WHERE payment_ref = ? LIMIT 1`,
    [paymentRef],
  );
  return (rows[0] as DealerDirectPaymentRow | undefined) ?? null;
}

export async function repoFailDealerDirectPaymentInit(
  paymentRef: string,
  errorPayload?: unknown,
) {
  await pool.execute(
    `
      UPDATE dealer_direct_payments
         SET status = 'failed',
             response_payload = COALESCE(?, response_payload),
             last_error = COALESCE(JSON_UNQUOTE(JSON_EXTRACT(?, '$.message')), last_error),
             updated_at = CURRENT_TIMESTAMP(3)
       WHERE payment_ref = ?
         AND status = 'pending'
    `,
    [stringifyPayload(errorPayload), stringifyPayload(errorPayload), paymentRef],
  );
}

export async function repoMarkDealerDirectPaymentFailed(
  paymentRef: string,
  callbackPayload?: unknown,
  lastError?: string,
) {
  await pool.execute(
    `
      UPDATE dealer_direct_payments
         SET status = 'failed',
             callback_payload = COALESCE(?, callback_payload),
             last_error = COALESCE(?, last_error),
             updated_at = CURRENT_TIMESTAMP(3)
       WHERE payment_ref = ?
         AND status = 'pending'
    `,
    [stringifyPayload(callbackPayload), lastError ?? null, paymentRef],
  );
}

export async function repoApplyDealerDirectPaymentSuccess(
  paymentRef: string,
  provider: string,
  callbackPayload?: unknown,
): Promise<
  | { ok: true; status: 'paid' | 'already_paid'; dealerId: string }
  | { ok: false; code: 'payment_not_found' | 'invalid_payment_state' }
> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.execute<RowDataPacket[]>(
      `
        SELECT dp.*, d.current_balance
          FROM dealer_direct_payments dp
          JOIN dealer_profiles d
            ON d.id = dp.dealer_id
         WHERE dp.payment_ref = ?
         LIMIT 1
         FOR UPDATE
      `,
      [paymentRef],
    );

    const row = rows[0];
    if (!row) {
      await conn.rollback();
      return { ok: false, code: 'payment_not_found' };
    }

    if (row.status === 'succeeded') {
      await conn.commit();
      return { ok: true, status: 'already_paid', dealerId: String(row.dealer_id) };
    }

    if (row.status !== 'pending') {
      await conn.rollback();
      return { ok: false, code: 'invalid_payment_state' };
    }

    const amount = Number.parseFloat(String(row.amount)) || 0;
    const currentBalance = Number.parseFloat(String(row.current_balance)) || 0;
    const newBalance = currentBalance - amount;
    const note = String(row.note ?? '').trim();
    const description = note ? `Online odeme - ${note}` : 'online_direct_payment';

    await conn.execute(
      `
        INSERT INTO dealer_transactions (
          id, dealer_id, order_id, type, amount, balance_after, description, due_date, created_at, created_by
        ) VALUES (?, ?, NULL, 'payment', ?, ?, ?, NULL, CURRENT_TIMESTAMP(3), NULL)
      `,
      [randomUUID(), row.dealer_id, String(-amount), String(newBalance), description],
    );

    await conn.execute(
      `
        UPDATE dealer_profiles
           SET current_balance = ?,
               updated_at = CURRENT_TIMESTAMP(3)
         WHERE id = ?
      `,
      [String(newBalance), row.dealer_id],
    );

    await conn.execute(
      `
        UPDATE dealer_direct_payments
           SET status = 'succeeded',
               provider = ?,
               callback_payload = COALESCE(?, callback_payload),
               updated_at = CURRENT_TIMESTAMP(3)
         WHERE payment_ref = ?
      `,
      [provider, stringifyPayload(callbackPayload), paymentRef],
    );

    await conn.commit();
    return { ok: true, status: 'paid', dealerId: String(row.dealer_id) };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

export async function repoExpireStaleDealerDirectPayments(timeoutMinutes: number): Promise<number> {
  try {
    const [res] = await pool.execute<ResultSetHeader>(
      `
        UPDATE dealer_direct_payments
           SET status = 'expired',
               last_error = COALESCE(last_error, 'payment_timeout'),
               updated_at = CURRENT_TIMESTAMP(3)
         WHERE status = 'pending'
           AND provider IN ('craftgate', 'nestpay_isbank', 'halkode', 'ziraatpay')
           AND created_at < (CURRENT_TIMESTAMP(3) - INTERVAL ? MINUTE)
      `,
      [timeoutMinutes],
    );

    return Number(res.affectedRows ?? 0);
  } catch (error) {
    const err = error as { code?: string; errno?: number };
    if (err?.code === 'ER_NO_SUCH_TABLE' || err?.errno === 1146) {
      return 0;
    }
    throw error;
  }
}
