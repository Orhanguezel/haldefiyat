// src/modules/dealerFinance/router.ts
import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/auth';
import { requireDealer } from '../../middleware/roles';
import { requireApprovedDealer } from '../../middleware/approved-dealer';
import {
  dealerGetMyProfile,
  dealerUpdateMyProfile,
  dealerGetMyBalance,
  dealerGetFinanceSummary,
  dealerPostFinanceSendAlerts,
  dealerGetFinanceStatementPdf,
  dealerListMyTransactions,
} from './controller';
import {
  dealerDirectHalkodeCallback,
  dealerDirectHalkodeFailCallback,
  dealerDirectHalkodeWebhook,
  initiateDealerDirectCardPayment,
} from './direct-payment.controller';
import { dealerListCatalogProducts } from './dealer-catalog.controller';
import { listPublicDealers } from './public.controller';
import { registerDealerPublic } from './dealer-register.controller';

const dealerOnly = { preHandler: [requireAuth, requireDealer, requireApprovedDealer] };

export async function registerDealerFinance(app: FastifyInstance) {
  app.get('/dealers/public', { config: { public: true } }, listPublicDealers);
  app.post(
    '/dealer/register',
    { config: { public: true, rateLimit: { max: 5, timeWindow: '1 hour' } } },
    registerDealerPublic,
  );

  app.post('/dealer/finance/payment/card/halkode/ok', dealerDirectHalkodeCallback);
  app.post('/dealer/finance/payment/card/halkode/fail', dealerDirectHalkodeFailCallback);
  app.post('/dealer/finance/payment/card/halkode/webhook', dealerDirectHalkodeWebhook);

  app.get('/dealer/products', dealerOnly, dealerListCatalogProducts);

  app.get('/dealer/profile', dealerOnly, dealerGetMyProfile);
  app.put('/dealer/profile', dealerOnly, dealerUpdateMyProfile);
  app.get('/dealer/balance', dealerOnly, dealerGetMyBalance);
  app.get('/dealer/finance/statement.pdf', dealerOnly, dealerGetFinanceStatementPdf);
  app.post('/dealer/finance/send-alerts', dealerOnly, dealerPostFinanceSendAlerts);
  app.get('/dealer/finance/summary', dealerOnly, dealerGetFinanceSummary);
  app.post('/dealer/finance/direct-payment/card/initiate', dealerOnly, initiateDealerDirectCardPayment);
  app.get('/dealer/transactions', dealerOnly, dealerListMyTransactions);
}
