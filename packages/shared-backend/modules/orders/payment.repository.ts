// src/modules/orders/payment.repository.ts
import { and, eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { db } from '../../db/client';
import { pool } from '../../db/client';
import { orders, orderItems } from '@agro/shared-backend/modules/orders';
import { products, productI18n } from '../products/schema';

export type OrderIyzicoLine = {
  product_id: string;
  quantity: number;
  total_price: string;
  title: string | null;
};

export async function repoListOrderItemsForIyzico(orderId: string, locale: string): Promise<OrderIyzicoLine[]> {
  const rows = await db
    .select({
      product_id: orderItems.product_id,
      quantity: orderItems.quantity,
      total_price: orderItems.total_price,
      title: productI18n.title,
    })
    .from(orderItems)
    .innerJoin(products, eq(products.id, orderItems.product_id))
    .leftJoin(
      productI18n,
      and(eq(productI18n.product_id, products.id), eq(productI18n.locale, locale)),
    )
    .where(eq(orderItems.order_id, orderId));

  return rows.map((r) => ({
    ...r,
    title: r.title ?? r.product_id,
  }));
}

export async function repoGetOrderRowById(id: string) {
  const [row] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return row ?? null;
}

export type StartOrderPaymentResult =
  | { ok: true }
  | {
      ok: false;
      code:
        | 'order_not_found'
        | 'order_cancelled'
        | 'already_paid'
        | 'payment_already_in_progress'
        | 'invalid_order_state';
    };

function stringifyPayload(payload: unknown): string | null {
  if (payload == null) return null;
  try {
    return JSON.stringify(payload);
  } catch {
    return null;
  }
}

export async function repoStartOrderPaymentAttempt(params: {
  orderId: string;
  paymentRef: string;
  method: string;
  amount: string;
  requestPayload?: unknown;
}): Promise<StartOrderPaymentResult> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [updateRes] = await conn.execute<ResultSetHeader>(
      `
        UPDATE orders
           SET payment_ref = ?,
               payment_method = ?,
               payment_status = 'pending',
               updated_at = CURRENT_TIMESTAMP(3)
         WHERE id = ?
           AND status = 'pending'
           AND payment_status IN ('unpaid', 'failed')
      `,
      [params.paymentRef, params.method, params.orderId],
    );

    if (updateRes.affectedRows !== 1) {
      const [rows] = await conn.execute<RowDataPacket[]>(
        `SELECT status, payment_status FROM orders WHERE id = ? LIMIT 1`,
        [params.orderId],
      );
      await conn.rollback();

      const row = rows[0];
      if (!row) return { ok: false, code: 'order_not_found' };
      if (row.status === 'cancelled') return { ok: false, code: 'order_cancelled' };
      if (row.payment_status === 'paid') return { ok: false, code: 'already_paid' };
      if (row.payment_status === 'pending') {
        return { ok: false, code: 'payment_already_in_progress' };
      }
      return { ok: false, code: 'invalid_order_state' };
    }

    await conn.execute(
      `
        INSERT INTO payment_attempts (
          id, order_id, payment_ref, provider, status, amount, request_payload, created_at, updated_at
        ) VALUES (?, ?, ?, ?, 'pending', ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
      `,
      [
        randomUUID(),
        params.orderId,
        params.paymentRef,
        params.method,
        params.amount,
        stringifyPayload(params.requestPayload),
      ],
    );

    await conn.commit();
    return { ok: true };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

export async function repoGetOrderByPaymentRef(ref: string) {
  const [row] = await db.select().from(orders).where(eq(orders.payment_ref, ref)).limit(1);
  return row ?? null;
}

export async function repoFailOrderPaymentInit(
  orderId: string,
  paymentRef: string,
  errorPayload?: unknown,
) {
  await pool.execute(
    `
      UPDATE orders
         SET payment_status = 'failed',
             payment_ref = NULL,
             updated_at = CURRENT_TIMESTAMP(3)
       WHERE id = ?
         AND payment_ref = ?
    `,
    [orderId, paymentRef],
  );

  await pool.execute(
    `
      UPDATE payment_attempts
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

export async function repoMarkOrderPaid(
  orderId: string,
  method: string,
  paymentRef?: string,
  callbackPayload?: unknown,
) {
  await db
    .update(orders)
    .set({
      payment_status: 'paid',
      payment_method: method,
      status: 'confirmed',
      updated_at: new Date(),
    })
    .where(eq(orders.id, orderId));

  if (!paymentRef) return;

  await pool.execute(
    `
      UPDATE payment_attempts
         SET status = 'succeeded',
             callback_payload = COALESCE(?, callback_payload),
             updated_at = CURRENT_TIMESTAMP(3)
       WHERE payment_ref = ?
    `,
    [stringifyPayload(callbackPayload), paymentRef],
  );
}

export async function repoMarkOrderPaymentFailed(
  orderId: string,
  paymentRef?: string,
  callbackPayload?: unknown,
  lastError?: string,
) {
  await db
    .update(orders)
    .set({
      payment_status: 'failed',
      updated_at: new Date(),
    })
    .where(eq(orders.id, orderId));

  if (!paymentRef) return;

  await pool.execute(
    `
      UPDATE payment_attempts
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

export async function repoSetOrderBankTransfer(orderId: string) {
  await pool.execute(
    `
      UPDATE orders
         SET payment_method = 'bank_transfer',
             payment_status = 'pending',
             updated_at = CURRENT_TIMESTAMP(3)
       WHERE id = ?
         AND status = 'pending'
         AND payment_status IN ('unpaid', 'failed')
    `,
    [orderId],
  );
}

export async function repoExpireStalePaymentAttempts(timeoutMinutes: number): Promise<number> {
  const [res] = await pool.execute<ResultSetHeader>(
    `
      UPDATE payment_attempts pa
      JOIN orders o
        ON o.id = pa.order_id
       AND o.payment_ref = pa.payment_ref
       AND o.payment_status = 'pending'
         SET pa.status = 'expired',
             pa.last_error = COALESCE(pa.last_error, 'payment_timeout'),
             pa.updated_at = CURRENT_TIMESTAMP(3),
             o.payment_status = 'failed',
             o.updated_at = CURRENT_TIMESTAMP(3)
       WHERE pa.status = 'pending'
         AND pa.provider IN ('iyzico', 'craftgate', 'nestpay_isbank', 'halkode', 'ziraatpay')
         AND pa.created_at < (CURRENT_TIMESTAMP(3) - INTERVAL ? MINUTE)
    `,
    [timeoutMinutes],
  );

  return Number(res.affectedRows ?? 0);
}
