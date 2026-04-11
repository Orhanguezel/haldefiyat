import type { FastifyRequest, FastifyReply } from 'fastify';
import { env } from '../../core/env';
import { retrieveCheckoutForm } from '../payments';
import {
  repoGetOrderByPaymentRef,
  repoMarkOrderPaid,
  repoMarkOrderPaymentFailed,
} from './payment.repository';

function panelOrdersUrl(status: string, extra = '') {
  const loc = env.FRONTEND_DEFAULT_LOCALE;
  const base = env.FRONTEND_URL.replace(/\/$/, '');
  return `${base}/${loc}/panel/siparisler?payment=${status}${extra}`;
}

/** POST /orders/payment/iyzico/callback — Iyzico sunucusundan (public) */
export async function orderIyzicoCallback(req: FastifyRequest, reply: FastifyReply) {
  const failUrl = panelOrdersUrl('fail');

  try {
    const body = req.body as Record<string, string>;
    const token = body?.token;
    const iyzicoStatus = body?.status;
    const conversationId = body?.conversationId;

    if (!token || !conversationId) {
      return reply.redirect(`${failUrl}&reason=no_token`);
    }

    const order = await repoGetOrderByPaymentRef(conversationId);
    if (!order) {
      req.log.warn({ conversationId }, 'order_iyzico_callback: order not found');
      return reply.redirect(`${failUrl}&reason=order_not_found`);
    }

    if (order.payment_status === 'paid') {
      return reply.redirect(panelOrdersUrl('success', `&order=${encodeURIComponent(order.id)}`));
    }

    if (iyzicoStatus !== 'success') {
      await repoMarkOrderPaymentFailed(order.id, conversationId, body, 'payment_failed');
      return reply.redirect(`${failUrl}&reason=payment_failed`);
    }

    const detail = await retrieveCheckoutForm(
      {
        apiKey: env.IYZICO_API_KEY,
        secretKey: env.IYZICO_SECRET_KEY,
        uri: env.IYZICO_BASE_URL,
      },
      token,
      conversationId,
    );

    const paid =
      detail.status === 'success' &&
      detail.paymentStatus === 'SUCCESS' &&
      (detail.fraudStatus ?? 0) === 1;

    if (!paid) {
      await repoMarkOrderPaymentFailed(order.id, conversationId, detail, 'verification_failed');
      req.log.warn({ detail, orderId: order.id }, 'order_iyzico_callback: verification failed');
      return reply.redirect(`${failUrl}&reason=verification_failed`);
    }

    await repoMarkOrderPaid(order.id, 'iyzico', conversationId, detail);
    return reply.redirect(panelOrdersUrl('success', `&order=${encodeURIComponent(order.id)}`));
  } catch (e) {
    req.log.error(e, 'order_iyzico_callback');
    return reply.redirect(`${failUrl}&reason=server_error`);
  }
}
