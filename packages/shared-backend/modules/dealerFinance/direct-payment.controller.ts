import type { FastifyReply, FastifyRequest } from 'fastify';
import { randomUUID } from 'crypto';
import { getAuthUserId, handleRouteError, sendNotFound, sendValidationError } from '../_shared';
import {
  initiateHalkodePayment,
  verifyHalkodeCallback,
  isHalkodePaymentApproved,
  getHalkodeOrderId,
} from '../halkode';
import { env } from '../../core/env';
import { repoGetDealerProfile } from './repository';
import { dealerDirectPaymentBodySchema } from '@agro/shared-backend/modules/dealerFinance';
import {
  repoApplyDealerDirectPaymentSuccess,
  repoCreateDealerDirectPaymentAttempt,
  repoFailDealerDirectPaymentInit,
  repoGetDealerDirectPaymentByRef,
  repoMarkDealerDirectPaymentFailed,
} from './direct-payment.repository';

function directPaymentCallbackUrl(path: string): string {
  const base = env.PUBLIC_URL.replace(/\/$/, '');
  return `${base}/api/v1/orders/payment/card/halkode/${path}`;
}

function panelFinanceUrl(status: 'success' | 'fail', extra = '') {
  const loc = env.FRONTEND_DEFAULT_LOCALE;
  const base = env.FRONTEND_URL.replace(/\/$/, '');
  return `${base}/${loc}/bayi/finans?payment=${status}${extra}`;
}

function halkodeConfig() {
  return {
    appId: env.HALKODE_APP_ID,
    appSecret: env.HALKODE_APP_SECRET,
    merchantKey: env.HALKODE_MERCHANT_KEY,
    posId: env.HALKODE_POS_ID,
    apiBase: env.HALKODE_API_BASE,
  };
}

export async function initiateDealerDirectCardPayment(req: FastifyRequest, reply: FastifyReply) {
  let paymentRef: string | null = null;
  try {
    if (!env.FEATURE_BANK_CARD_PAYMENT) {
      return reply.code(503).send({ error: { message: 'bank_card_feature_disabled' } });
    }

    const userId = getAuthUserId(req);
    const profile = await repoGetDealerProfile(userId);
    if (!profile) return sendNotFound(reply);

    const parsed = dealerDirectPaymentBodySchema.safeParse(req.body ?? {});
    if (!parsed.success) return sendValidationError(reply, parsed.error.issues);

    const amount = Number(parsed.data.amount.toFixed(2));
    const locale = parsed.data.locale ?? 'tr';
    const note = parsed.data.note.trim();
    paymentRef = randomUUID();

    const rawIp =
      (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ??
      req.ip ??
      '127.0.0.1';
    const buyerIp = rawIp === '::1' || rawIp === '::ffff:127.0.0.1' ? '127.0.0.1' : rawIp;

    await repoCreateDealerDirectPaymentAttempt({
      dealerProfileId: profile.id,
      paymentRef,
      provider: 'halkode',
      amount: amount.toFixed(2),
      note,
      requestPayload: { locale, buyerIp, amount, note },
    });

    if (!env.HALKODE_APP_ID || !env.HALKODE_MERCHANT_KEY) {
      await repoFailDealerDirectPaymentInit(paymentRef, { message: 'halkode_not_configured' });
      return reply.code(503).send({ error: { message: 'halkode_not_configured' } });
    }

    if (!env.HALKODE_POS_ID) {
      await repoFailDealerDirectPaymentInit(paymentRef, { message: 'halkode_pos_id_not_configured' });
      return reply.code(503).send({ error: { message: 'halkode_pos_id_not_configured' } });
    }

    const result = await initiateHalkodePayment(halkodeConfig(), {
      invoiceId: paymentRef,
      amount,
      okUrl: directPaymentCallbackUrl('ok'),
      failUrl: directPaymentCallbackUrl('fail'),
      ccHolderName: parsed.data.cc_holder_name ?? profile.company_name ?? '',
      ccNo: parsed.data.cc_no,
      expMonth: parsed.data.exp_month,
      expYear: parsed.data.exp_year,
      cvv: parsed.data.cvv,
      lang: locale === 'en' ? 'en' : 'tr',
    });

    // Banka redirect URL veya HTML form döndürebilir
    if (result.redirectUrl) {
      return reply.send({ provider: 'halkode', redirectUrl: result.redirectUrl });
    }
    if (result.html) {
      return reply.send({ provider: 'halkode', formHtml: result.html });
    }

    // Beklenmedik yanıt
    await repoFailDealerDirectPaymentInit(paymentRef, { message: 'halkode_no_redirect', raw: result.raw });
    return reply.code(502).send({ error: { message: 'halkode_no_redirect' } });
  } catch (e) {
    if (paymentRef) {
      await repoFailDealerDirectPaymentInit(paymentRef, {
        message: e instanceof Error ? e.message : 'dealer_direct_payment_init_failed',
      }).catch(() => {});
    }
    return handleRouteError(reply, req, e, 'dealer_direct_card_payment_init');
  }
}

async function handleHalkodeDealerDirectCallback(
  req: FastifyRequest,
  reply: FastifyReply,
  opts?: { webhook?: boolean },
) {
  const failUrl = panelFinanceUrl('fail');
  const isWebhook = opts?.webhook === true;
  try {
    const body = req.body as Record<string, string>;
    const paymentRef = getHalkodeOrderId(body);

    if (!verifyHalkodeCallback(body, env.HALKODE_MERCHANT_KEY)) {
      if (isWebhook) return reply.code(400).send({ ok: false, reason: 'hash_mismatch' });
      return reply.redirect(`${failUrl}&reason=hash_mismatch`);
    }

    const payment = await repoGetDealerDirectPaymentByRef(paymentRef);
    if (!payment) {
      if (isWebhook) return reply.code(404).send({ ok: false, reason: 'payment_not_found' });
      return reply.redirect(`${failUrl}&reason=payment_not_found`);
    }

    if (payment.status === 'succeeded') {
      if (isWebhook) return reply.send({ ok: true, status: 'already_paid' });
      return reply.redirect(panelFinanceUrl('success', `&ref=${encodeURIComponent(paymentRef)}`));
    }

    if (!isHalkodePaymentApproved(body)) {
      await repoMarkDealerDirectPaymentFailed(paymentRef, body, 'payment_failed');
      if (isWebhook) return reply.code(400).send({ ok: false, reason: 'payment_failed' });
      return reply.redirect(`${failUrl}&reason=payment_failed`);
    }

    const res = await repoApplyDealerDirectPaymentSuccess(paymentRef, 'halkode', body);
    if (!res.ok) {
      if (isWebhook) return reply.code(404).send({ ok: false, reason: res.code });
      return reply.redirect(`${failUrl}&reason=${res.code}`);
    }

    if (isWebhook) return reply.send({ ok: true, status: res.status });
    return reply.redirect(panelFinanceUrl('success', `&ref=${encodeURIComponent(paymentRef)}`));
  } catch (e) {
    req.log.error(e, 'dealer_direct_halkode_callback');
    if (isWebhook) return reply.code(500).send({ ok: false, reason: 'server_error' });
    return reply.redirect(`${failUrl}&reason=server_error`);
  }
}

export async function dealerDirectHalkodeCallback(req: FastifyRequest, reply: FastifyReply) {
  return handleHalkodeDealerDirectCallback(req, reply);
}

export async function dealerDirectHalkodeFailCallback(req: FastifyRequest, reply: FastifyReply) {
  return handleHalkodeDealerDirectCallback(req, reply);
}

export async function dealerDirectHalkodeWebhook(req: FastifyRequest, reply: FastifyReply) {
  return handleHalkodeDealerDirectCallback(req, reply, { webhook: true });
}
