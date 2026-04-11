// src/modules/orders/router.ts
import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/auth';
import { requireDealer } from '../../middleware/roles';
import { requireApprovedDealer } from '../../middleware/approved-dealer';
import {
  dealerListOrders,
  dealerGetOrder,
  dealerCreateOrder,
  dealerCancelOrder,
} from './controller';
import {
  initiateOrderBankTransfer,
  initiateOrderCreditPayment,
  initiateOrderIyzicoPayment,
} from './payment.controller';
import { orderIyzicoCallback } from './payment-callback.controller';
import { initiateOrderCardPayment } from './payment-card.controller';
import {
  cardHalkodeCallback,
  cardHalkodeFailCallback,
  cardHalkodeWebhook,
} from './payment-card-callback.controller';

const dealerOrder = { preHandler: [requireAuth, requireDealer, requireApprovedDealer] };

export async function registerOrders(app: FastifyInstance) {
  const B = '/orders';

  // Public callbacks (Halk Öde → browser GET redirect)
  app.post(`${B}/payment/iyzico/callback`, orderIyzicoCallback);
  app.post(`${B}/payment/card/halkode/ok`, cardHalkodeCallback);
  app.post(`${B}/payment/card/halkode/fail`, cardHalkodeFailCallback);
  app.post(`${B}/payment/card/halkode/webhook`, cardHalkodeWebhook);

  // Bayi korumalı route'lar
  app.get(B, dealerOrder, dealerListOrders);
  app.get(`${B}/:id`, dealerOrder, dealerGetOrder);
  app.post(B, dealerOrder, dealerCreateOrder);
  app.patch(`${B}/:id/cancel`, dealerOrder, dealerCancelOrder);
  app.post(`${B}/:id/payment/bank-transfer`, dealerOrder, initiateOrderBankTransfer);
  app.post(`${B}/:id/payment/credit`, dealerOrder, initiateOrderCreditPayment);
  app.post(`${B}/:id/payment/iyzico/initiate`, dealerOrder, initiateOrderIyzicoPayment);
  app.post(`${B}/:id/payment/card/initiate`, dealerOrder, initiateOrderCardPayment);
}
