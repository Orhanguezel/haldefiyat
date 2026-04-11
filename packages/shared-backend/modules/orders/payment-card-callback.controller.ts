// src/modules/orders/payment-card-callback.controller.ts
import type { FastifyRequest, FastifyReply } from 'fastify';
import { verifyHalkodeCallback, isHalkodePaymentApproved, getHalkodeOrderId } from '../halkode';
import { env } from '../../core/env';
import { repoGetOrderByPaymentRef, repoMarkOrderPaid, repoMarkOrderPaymentFailed } from './payment.repository';
import {
  repoApplyDealerDirectPaymentSuccess,
  repoGetDealerDirectPaymentByRef,
  repoMarkDealerDirectPaymentFailed,
} from '../dealerFinance/direct-payment.repository';

function panelOrdersUrl(status: 'success' | 'fail', extra = '') {
  const loc = env.FRONTEND_DEFAULT_LOCALE;
  const base = env.FRONTEND_URL.replace(/\/$/, '');
  return `${base}/${loc}/panel/siparisler?payment=${status}${extra}`;
}

function panelFinanceUrl(status: 'success' | 'fail', extra = '') {
  const loc = env.FRONTEND_DEFAULT_LOCALE;
  const base = env.FRONTEND_URL.replace(/\/$/, '');
  return `${base}/${loc}/bayi/finans?payment=${status}${extra}`;
}

async function handleHalkodeCallback(
  req: FastifyRequest,
  reply: FastifyReply,
  opts?: { webhook?: boolean },
) {
  const failUrl = panelOrdersUrl('fail');
  const isWebhook = opts?.webhook === true;
  try {
    const body = req.body as Record<string, string>;
    const paymentRef = getHalkodeOrderId(body);

    if (!verifyHalkodeCallback(body, env.HALKODE_MERCHANT_KEY)) {
      req.log.warn({ oid: paymentRef }, 'halkode_callback: hash mismatch');
      if (isWebhook) return reply.code(400).send({ ok: false, reason: 'hash_mismatch' });
      return reply.redirect(`${failUrl}&reason=hash_mismatch`);
    }

    // dealer direct payment mi?
    const directPayment = await repoGetDealerDirectPaymentByRef(paymentRef).catch(() => null);
    if (directPayment) {
      if (directPayment.status === 'succeeded') {
        if (isWebhook) return reply.send({ ok: true, status: 'already_paid' });
        return reply.redirect(panelFinanceUrl('success', `&ref=${encodeURIComponent(paymentRef)}`));
      }
      if (!isHalkodePaymentApproved(body)) {
        await repoMarkDealerDirectPaymentFailed(paymentRef, body, 'payment_failed').catch(() => {});
        if (isWebhook) return reply.code(400).send({ ok: false, reason: 'payment_failed' });
        return reply.redirect(`${panelFinanceUrl('fail')}&reason=payment_failed`);
      }
      const directRes = await repoApplyDealerDirectPaymentSuccess(paymentRef, 'halkode', body);
      if (!directRes.ok) {
        if (isWebhook) return reply.code(404).send({ ok: false, reason: directRes.code });
        return reply.redirect(`${panelFinanceUrl('fail')}&reason=${directRes.code}`);
      }
      if (isWebhook) return reply.send({ ok: true, status: directRes.status });
      return reply.redirect(panelFinanceUrl('success', `&ref=${encodeURIComponent(paymentRef)}`));
    }

    // sipariş ödemesi
    const order = await repoGetOrderByPaymentRef(paymentRef).catch(() => null);
    if (!order) {
      req.log.warn({ paymentRef }, 'halkode_callback: not found');
      if (isWebhook) return reply.code(404).send({ ok: false, reason: 'payment_not_found' });
      return reply.redirect(`${failUrl}&reason=payment_not_found`);
    }

    if (order.payment_status === 'paid') {
      if (isWebhook) return reply.send({ ok: true, status: 'already_paid', orderId: order.id });
      return reply.redirect(panelOrdersUrl('success', `&order=${encodeURIComponent(order.id)}`));
    }

    if (!isHalkodePaymentApproved(body)) {
      await repoMarkOrderPaymentFailed(order.id, paymentRef, body, 'payment_failed').catch(() => {});
      if (isWebhook) return reply.code(400).send({ ok: false, reason: 'payment_failed' });
      return reply.redirect(`${failUrl}&reason=payment_failed`);
    }

    await repoMarkOrderPaid(order.id, 'halkode', paymentRef, body);
    if (isWebhook) return reply.send({ ok: true, status: 'paid', orderId: order.id });
    return reply.redirect(panelOrdersUrl('success', `&order=${encodeURIComponent(order.id)}`));
  } catch (e) {
    req.log.error(e, 'halkode_callback');
    if (isWebhook) return reply.code(500).send({ ok: false, reason: 'server_error' });
    return reply.redirect(`${failUrl}&reason=server_error`);
  }
}

export async function cardHalkodeCallback(req: FastifyRequest, reply: FastifyReply) {
  return handleHalkodeCallback(req, reply);
}

export async function cardHalkodeFailCallback(req: FastifyRequest, reply: FastifyReply) {
  return handleHalkodeCallback(req, reply);
}

export async function cardHalkodeWebhook(req: FastifyRequest, reply: FastifyReply) {
  return handleHalkodeCallback(req, reply, { webhook: true });
}
