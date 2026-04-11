// src/modules/orders/payment-card.controller.ts
import type { FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';
import { getAuthUserId, handleRouteError, sendNotFound, sendValidationError } from '../_shared';
import { initiateHalkodePayment } from '../halkode';
import { repoGetDealerProfile } from '../dealerFinance/repository';
import { env } from '../../core/env';
import {
  repoGetOrderRowById,
  repoStartOrderPaymentAttempt,
  repoFailOrderPaymentInit,
} from './payment.repository';
import { orderPaymentLocaleQuerySchema } from '@agro/shared-backend/modules/orders';

function halkodeCallbackUrl(path: string): string {
  const base = env.PUBLIC_URL.replace(/\/$/, '');
  return `${base}/api/v1/orders/payment/card/halkode/${path}`;
}

export async function initiateOrderCardPayment(req: FastifyRequest, reply: FastifyReply) {
  let paymentRef: string | null = null;
  try {
    if (!env.FEATURE_BANK_CARD_PAYMENT) {
      return reply.code(503).send({ error: { message: 'bank_card_feature_disabled' } });
    }

    const dealerId = getAuthUserId(req);
    const { id: orderId } = req.params as { id: string };

    const parsedQ = orderPaymentLocaleQuerySchema.safeParse(req.query ?? {});
    if (!parsedQ.success) return sendValidationError(reply, parsedQ.error.issues);
    const locale = parsedQ.data.locale ?? 'tr';

    const order = await repoGetOrderRowById(orderId);
    if (!order || order.dealer_id !== dealerId) return sendNotFound(reply);

    if (order.status === 'cancelled') {
      return reply.code(400).send({ error: { message: 'order_cancelled' } });
    }
    if (order.payment_status === 'paid') {
      return reply.code(400).send({ error: { message: 'already_paid' } });
    }

    paymentRef = randomUUID();
    const amount = parseFloat(String(order.total));

    const rawIp =
      (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ??
      req.ip ??
      '127.0.0.1';
    const buyerIp = rawIp === '::1' || rawIp === '::ffff:127.0.0.1' ? '127.0.0.1' : rawIp;

    const startRes = await repoStartOrderPaymentAttempt({
      orderId,
      paymentRef,
      method: 'halkode',
      amount: amount.toFixed(2),
      requestPayload: { locale, buyerIp, amount },
    });
    if (!startRes.ok) {
      const code = startRes.code === 'order_not_found' ? 404 : 400;
      return reply.code(code).send({ error: { message: startRes.code } });
    }

    if (!env.HALKODE_APP_ID || !env.HALKODE_MERCHANT_KEY) {
      await repoFailOrderPaymentInit(orderId, paymentRef, { message: 'halkode_not_configured' });
      return reply.code(503).send({ error: { message: 'halkode_not_configured' } });
    }

    if (!env.HALKODE_POS_ID) {
      await repoFailOrderPaymentInit(orderId, paymentRef, { message: 'halkode_pos_id_not_configured' });
      return reply.code(503).send({ error: { message: 'halkode_pos_id_not_configured' } });
    }

    const dealerProfile = await repoGetDealerProfile(dealerId);

    const result = await initiateHalkodePayment(
      {
        appId: env.HALKODE_APP_ID,
        appSecret: env.HALKODE_APP_SECRET,
        merchantKey: env.HALKODE_MERCHANT_KEY,
        posId: env.HALKODE_POS_ID,
        apiBase: env.HALKODE_API_BASE,
      },
      {
        invoiceId: paymentRef,
        amount,
        okUrl: halkodeCallbackUrl('ok'),
        failUrl: halkodeCallbackUrl('fail'),
        ccHolderName: dealerProfile?.company_name ?? '',
        lang: locale === 'en' ? 'en' : 'tr',
      },
    );

    if (result.redirectUrl) {
      return reply.send({ provider: 'halkode', redirectUrl: result.redirectUrl });
    }
    if (result.html) {
      return reply.send({ provider: 'halkode', formHtml: result.html });
    }

    await repoFailOrderPaymentInit(orderId, paymentRef, { message: 'halkode_no_redirect' });
    return reply.code(502).send({ error: { message: 'halkode_no_redirect' } });
  } catch (e) {
    if (paymentRef) {
      await repoFailOrderPaymentInit(orderIdFromReq(req), paymentRef, {
        message: e instanceof Error ? e.message : 'order_card_payment_init_failed',
      }).catch(() => {});
    }
    return handleRouteError(reply, req, e, 'order_card_payment_init');
  }
}

function orderIdFromReq(req: FastifyRequest): string {
  return (req.params as { id: string }).id;
}
