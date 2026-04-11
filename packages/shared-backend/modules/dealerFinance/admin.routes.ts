// src/modules/dealerFinance/admin.routes.ts
import type { FastifyInstance } from 'fastify';
import {
  adminListDealerProfiles,
  adminGetDealerFinanceSummary,
  adminGetDealerProfile,
  adminUpdateDealerProfile,
  adminListDealerTransactions,
  adminCreateTransaction,
} from './admin.controller';
import { adminRunDealerFinanceBatchAlerts } from './admin-batch.controller';

export async function registerDealerFinanceAdmin(app: FastifyInstance) {
  const B = '/dealers';
  app.get(B, adminListDealerProfiles);
  app.post(`${B}/finance/run-alerts`, adminRunDealerFinanceBatchAlerts);
  app.get(`${B}/:id/finance/summary`, adminGetDealerFinanceSummary);
  app.get(`${B}/:id`, adminGetDealerProfile);
  app.patch(`${B}/:id`, adminUpdateDealerProfile);
  app.get(`${B}/:id/transactions`, adminListDealerTransactions);
  app.post(`${B}/:id/transactions`, adminCreateTransaction);
}
