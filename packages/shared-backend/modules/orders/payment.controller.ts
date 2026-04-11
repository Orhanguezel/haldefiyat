import type { FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import {
  getAuthUserId,
  handleRouteError,
  sendNotFound,
  sendValidationError,
} from '../_shared';
import { users } from '../auth/schema';
import { db } from '../../db/client';
import { env } from '../../core/env';
import { createCheckoutForm } from '../payments';
import {
  repoListOrderItemsForIyzico,
  repoGetOrderRowById,
  repoStartOrderPaymentAttempt,
  repoFailOrderPaymentInit,
  repoSetOrderBankTransfer,
} from './payment.repository';
import {
  CreditPaymentError,
  finalizeOrderPaymentWithDealerCredit,
} from './payment-credit.service';
import { orderPaymentLocaleQuerySchema } from '@agro/shared-backend/modules/orders';

export async function initiateOrderIyzicoPayment(req: FastifyRequest, reply: FastifyReply) {
  let paymentRef: string | null = null;
  try {
    if (!env.FEATURE_IYZICO_PAYMENT) {
      return reply.code(503).send({ error: { message: 'iyzico_feature_disabled' } });
    }

    const dealerId = getAuthUserId(req);
    const { id: orderId } = req.params as { id: string };

    const parsedQ = orderPaymentLocaleQuerySchema.safeParse(req.query ?? {});
    if (!parsedQ.success) return sendValidationError(reply, parsedQ.error.issues);
    const locale = parsedQ.data.locale ?? 'tr';
    const installment = parsedQ.data.installment ?? 1;

    if (!env.IYZICO_API_KEY || !env.IYZICO_SECRET_KEY) {
      return reply.code(503).send({ error: { message: 'iyzico_not_configured' } });
    }

    const order = await repoGetOrderRowById(orderId);
    if (!order || order.dealer_id !== dealerId) return sendNotFound(reply);

    if (order.status === 'cancelled') {
      return reply.code(400).send({ error: { message: 'order_cancelled' } });
    }
    if (order.payment_status === 'paid') {
      return reply.code(400).send({ error: { message: 'already_paid' } });
    }

    const lines = await repoListOrderItemsForIyzico(orderId, locale);
    if (lines.length === 0) {
      return reply.code(400).send({ error: { message: 'order_has_no_items' } });
    }

    const [user] = await db.select().from(users).where(eq(users.id, dealerId)).limit(1);
    if (!user) return sendNotFound(reply);

    const conversationId = randomUUID();
    paymentRef = conversationId;
    const amountStr = parseFloat(String(order.total)).toFixed(2);

    const rawIp =
      (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ??
      req.ip ??
      '127.0.0.1';
    const buyerIp = rawIp === '::1' || rawIp === '::ffff:127.0.0.1' ? '127.0.0.1' : rawIp;

    const nameParts = (user.full_name ?? 'Bayi').trim().split(/\s+/);
    const firstName = nameParts[0] ?? 'Bayi';
    const lastName = nameParts.slice(1).join(' ') || 'Musteri';

    const callbackUrl = `${env.PUBLIC_URL.replace(/\/$/, '')}/api/v1/orders/payment/iyzico/callback`;

    const basketItems = lines.map((line) => ({
      id: line.product_id,
      name: line.title ?? line.product_id,
      category1: 'Urun',
      itemType: 'PHYSICAL' as const,
      price: parseFloat(String(line.total_price)).toFixed(2),
    }));

    const basketSum = basketItems.reduce((s, b) => s + parseFloat(b.price), 0);
    const orderTotal = parseFloat(amountStr);
    if (Math.abs(basketSum - orderTotal) > 0.05) {
      req.log.warn({ basketSum, orderTotal, orderId }, 'order_iyzico_basket_mismatch');
      return reply.code(400).send({ error: { message: 'basket_total_mismatch' } });
    }

    const startRes = await repoStartOrderPaymentAttempt({
      orderId,
      paymentRef: conversationId,
      method: 'iyzico',
      amount: amountStr,
      requestPayload: {
        locale,
        buyerIp,
        basketCount: basketItems.length,
        amount: amountStr,
        installment,
      },
    });
    if (!startRes.ok) {
      const code = startRes.code === 'order_not_found' ? 404 : 400;
      return reply.code(code).send({ error: { message: startRes.code } });
    }

    const iyzicoReq = {
      locale: 'tr',
      conversationId,
      price: amountStr,
      paidPrice: amountStr,
      currency: 'TRY',
      basketId: orderId,
      paymentGroup: 'PRODUCT',
      callbackUrl,
      enabledInstallments: [installment],
      buyer: {
        id: dealerId,
        name: firstName,
        surname: lastName,
        email: user.email,
        identityNumber: '11111111111',
        registrationAddress: 'Turkiye',
        city: 'Istanbul',
        country: 'Turkey',
        ip: buyerIp,
      },
      shippingAddress: {
        contactName: `${firstName} ${lastName}`,
        city: 'Istanbul',
        country: 'Turkey',
        address: 'Turkiye',
      },
      billingAddress: {
        contactName: `${firstName} ${lastName}`,
        city: 'Istanbul',
        country: 'Turkey',
        address: 'Turkiye',
      },
      basketItems,
    };

    const iyzicoRes = await createCheckoutForm(
      {
        apiKey: env.IYZICO_API_KEY,
        secretKey: env.IYZICO_SECRET_KEY,
        uri: env.IYZICO_BASE_URL,
      },
      iyzicoReq,
    );

    if (iyzicoRes.status !== 'success' || !iyzicoRes.checkoutFormContent) {
      await repoFailOrderPaymentInit(orderId, conversationId, {
        message: 'iyzico_init_failed',
        provider: 'iyzico',
        response: iyzicoRes,
      });
      return reply.code(502).send({
        error: {
          message: 'iyzico_init_failed',
          details: iyzicoRes.errorMessage ?? undefined,
          errorCode: iyzicoRes.errorCode,
        },
      });
    }

    return reply.send({
      provider: 'iyzico',
      checkoutFormContent: iyzicoRes.checkoutFormContent,
      token: iyzicoRes.token,
      conversationId,
      amount: parseFloat(amountStr),
    });
  } catch (e) {
    if (paymentRef) {
      await repoFailOrderPaymentInit(orderIdFromReq(req), paymentRef, {
        message: e instanceof Error ? e.message : 'iyzico_init_exception',
        provider: 'iyzico',
      }).catch(() => {});
    }
    return handleRouteError(reply, req, e, 'order_iyzico_init');
  }
}

export async function initiateOrderBankTransfer(req: FastifyRequest, reply: FastifyReply) {
  try {
    const dealerId = getAuthUserId(req);
    const { id: orderId } = req.params as { id: string };

    const order = await repoGetOrderRowById(orderId);
    if (!order || order.dealer_id !== dealerId) return sendNotFound(reply);

    if (order.payment_status === 'paid') {
      return reply.code(400).send({ error: { message: 'already_paid' } });
    }
    if (order.payment_status === 'pending') {
      return reply.code(400).send({ error: { message: 'payment_already_in_progress' } });
    }

    await repoSetOrderBankTransfer(orderId);
    return reply.send({
      success: true,
      payment_method: 'bank_transfer',
      payment_status: 'pending',
    });
  } catch (e) {
    return handleRouteError(reply, req, e, 'order_bank_transfer');
  }
}

export async function initiateOrderCreditPayment(req: FastifyRequest, reply: FastifyReply) {
  try {
    const dealerId = getAuthUserId(req);
    const { id: orderId } = req.params as { id: string };

    await finalizeOrderPaymentWithDealerCredit({ userId: dealerId, orderId });
    return reply.send({
      success: true,
      payment_method: 'dealer_credit',
      payment_status: 'paid',
    });
  } catch (e) {
    if (e instanceof CreditPaymentError) {
      if (e.code === 'order_not_found') return sendNotFound(reply);
      return reply.code(400).send({ error: { message: e.code } });
    }
    return handleRouteError(reply, req, e, 'order_credit_payment');
  }
}

function orderIdFromReq(req: FastifyRequest): string {
  return (req.params as { id: string }).id;
}
