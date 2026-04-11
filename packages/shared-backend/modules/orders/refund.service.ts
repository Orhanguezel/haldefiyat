import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { dealerProfiles, dealerTransactions } from '@agro/shared-backend/modules/dealerFinance';
import { orders } from '@agro/shared-backend/modules/orders';

export class OrderRefundError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = 'OrderRefundError';
  }
}

export async function refundDealerCreditOrder(params: {
  orderId: string;
  adminUserId: string | null;
  reason?: string | null;
}) {
  await db.transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, params.orderId)).limit(1);
    if (!order) throw new OrderRefundError('order_not_found');
    if (order.payment_status === 'refunded') throw new OrderRefundError('already_refunded');
    if (order.payment_status !== 'paid') throw new OrderRefundError('order_not_paid');
    if (order.payment_method !== 'dealer_credit') {
      throw new OrderRefundError('refund_not_supported_for_payment_method');
    }

    const [dealer] = await tx
      .select()
      .from(dealerProfiles)
      .where(eq(dealerProfiles.user_id, order.dealer_id))
      .limit(1);
    if (!dealer) throw new OrderRefundError('dealer_not_found');

    const orderTotal = parseFloat(String(order.total));
    const currentBalance = parseFloat(String(dealer.current_balance));
    const newBalance = currentBalance - orderTotal;

    await tx.insert(dealerTransactions).values({
      id: randomUUID(),
      dealer_id: dealer.id,
      order_id: order.id,
      type: 'refund',
      amount: String(-orderTotal),
      balance_after: String(newBalance),
      description: params.reason?.trim() || 'order_refund',
      due_date: null,
      created_by: params.adminUserId,
    });

    await tx
      .update(dealerProfiles)
      .set({ current_balance: String(newBalance) })
      .where(eq(dealerProfiles.id, dealer.id));

    await tx
      .update(orders)
      .set({
        payment_status: 'refunded',
        status: 'cancelled',
        updated_at: new Date(),
      })
      .where(eq(orders.id, order.id));
  });
}
