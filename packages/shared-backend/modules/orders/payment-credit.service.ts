// src/modules/orders/payment-credit.service.ts
import { randomUUID } from 'crypto';
import { count, eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { dealerProfiles, dealerTransactions } from '@agro/shared-backend/modules/dealerFinance';
import { orders, orderItems } from '@agro/shared-backend/modules/orders';

export class CreditPaymentError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = 'CreditPaymentError';
  }
}

/**
 * Atomically books dealer credit, writes cari line, marks order paid+confirmed.
 */
export async function finalizeOrderPaymentWithDealerCredit(params: {
  userId: string;
  orderId: string;
}): Promise<void> {
  const { userId, orderId } = params;

  await db.transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order || order.dealer_id !== userId) {
      throw new CreditPaymentError('order_not_found');
    }
    if (order.status === 'cancelled') {
      throw new CreditPaymentError('order_cancelled');
    }
    if (order.payment_status === 'paid') {
      throw new CreditPaymentError('already_paid');
    }
    if (order.payment_status === 'pending') {
      throw new CreditPaymentError('payment_already_in_progress');
    }

    const [itemRow] = await tx
      .select({ c: count() })
      .from(orderItems)
      .where(eq(orderItems.order_id, orderId));
    if (Number(itemRow?.c ?? 0) === 0) {
      throw new CreditPaymentError('order_has_no_items');
    }

    const orderTotal = parseFloat(String(order.total));
    if (orderTotal <= 0) {
      throw new CreditPaymentError('invalid_order_total');
    }

    const [profile] = await tx
      .select()
      .from(dealerProfiles)
      .where(eq(dealerProfiles.user_id, userId))
      .limit(1);
    if (!profile) {
      throw new CreditPaymentError('dealer_not_found');
    }

    const currentBalance = parseFloat(String(profile.current_balance));
    const creditLimit = parseFloat(String(profile.credit_limit));
    const available = creditLimit - currentBalance;

    if (available < orderTotal) {
      throw new CreditPaymentError('insufficient_credit');
    }

    const newBalance = currentBalance + orderTotal;
    const txId = randomUUID();

    await tx.insert(dealerTransactions).values({
      id: txId,
      dealer_id: profile.id,
      order_id: orderId,
      type: 'order',
      amount: String(orderTotal),
      balance_after: String(newBalance),
      description: null,
      due_date: null,
      created_by: null,
    });

    await tx
      .update(dealerProfiles)
      .set({ current_balance: String(newBalance) })
      .where(eq(dealerProfiles.id, profile.id));

    await tx
      .update(orders)
      .set({
        payment_status: 'paid',
        payment_method: 'dealer_credit',
        status: 'confirmed',
        updated_at: new Date(),
      })
      .where(eq(orders.id, orderId));
  });
}
