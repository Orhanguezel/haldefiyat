// src/modules/dealerFinance/admin-batch.controller.ts
import type { FastifyRequest, FastifyReply } from 'fastify';
import { handleRouteError } from '../_shared';
import { repoListApprovedDealerUserIds } from './repository-batch';
import { sendDealerFinanceAlerts } from './finance-alerts';

/** POST /admin/dealers/finance/run-alerts — onaylı tüm bayilere cari uyarısı (skipCooldown) */
export async function adminRunDealerFinanceBatchAlerts(req: FastifyRequest, reply: FastifyReply) {
  try {
    const ids = await repoListApprovedDealerUserIds();
    const results: Array<{
      user_id: string;
      sent: boolean;
      email: boolean;
      reason?: string;
    }> = [];

    for (const userId of ids) {
      const r = await sendDealerFinanceAlerts(userId, { skipCooldown: true });
      results.push({ user_id: userId, ...r });
    }

    return reply.send({ total: ids.length, results });
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_dealer_finance_batch_alerts');
  }
}
