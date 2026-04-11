// src/modules/dealerFinance/controller.ts
import type { FastifyRequest, FastifyReply } from 'fastify';
import {
  getAuthUserId,
  parsePage,
  handleRouteError,
  sendNotFound,
  sendValidationError,
  setContentRange,
} from '../_shared';
import {
  repoGetDealerProfile,
  repoUpdateDealerProfile,
  repoListTransactions,
  repoCountTransactions,
} from './repository';
import {
  repoSumAmountsByType,
  repoCountAllTransactions,
  repoCountOverdueTransactions,
} from './repository-aggregates';
import {
  dealerSelfUpdateSchema,
  transactionListQuerySchema,
  buildFinanceSummaryPayload,
  type TransactionFilterParams,
  type DealerTransactionRow,
} from '@agro/shared-backend/modules/dealerFinance';
import { sendDealerFinanceAlerts } from './finance-alerts';
import { buildDealerStatementPdf } from './pdf-statement';

/** GET /dealer/profile — get own dealer profile */
export async function dealerGetMyProfile(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = getAuthUserId(req);
    const profile = await repoGetDealerProfile(userId);
    if (!profile) return sendNotFound(reply);
    return reply.send(profile);
  } catch (e) {
    return handleRouteError(reply, req, e, 'dealer_get_profile');
  }
}

/** PUT /dealer/profile — update own company info */
export async function dealerUpdateMyProfile(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = getAuthUserId(req);
    const profile = await repoGetDealerProfile(userId);
    if (!profile) return sendNotFound(reply);

    const parsed = dealerSelfUpdateSchema.safeParse(req.body);
    if (!parsed.success) return sendValidationError(reply, parsed.error.issues);

    await repoUpdateDealerProfile(profile.id, parsed.data);
    const updated = await repoGetDealerProfile(userId);
    return reply.send(updated);
  } catch (e) {
    return handleRouteError(reply, req, e, 'dealer_update_profile');
  }
}

/** GET /dealer/balance — get credit limit + current balance */
export async function dealerGetMyBalance(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = getAuthUserId(req);
    const profile = await repoGetDealerProfile(userId);
    if (!profile) return sendNotFound(reply);

    const limit = parseFloat(profile.credit_limit);
    const balance = parseFloat(profile.current_balance);

    return reply.send({
      credit_limit: limit,
      current_balance: balance,
      available: limit - balance,
      discount_rate: parseFloat(profile.discount_rate),
    });
  } catch (e) {
    return handleRouteError(reply, req, e, 'dealer_get_balance');
  }
}

/** GET /dealer/finance/summary — cari özet + tip bazlı toplamlar */
export async function dealerGetFinanceSummary(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = getAuthUserId(req);
    const profile = await repoGetDealerProfile(userId);
    if (!profile) return sendNotFound(reply);

    const [totalsByType, txCount, overdueCount] = await Promise.all([
      repoSumAmountsByType(profile.id),
      repoCountAllTransactions(profile.id),
      repoCountOverdueTransactions(profile.id),
    ]);

    return reply.send(
      buildFinanceSummaryPayload(profile, totalsByType, txCount, overdueCount),
    );
  } catch (e) {
    return handleRouteError(reply, req, e, 'dealer_finance_summary');
  }
}

/** POST /dealer/finance/send-alerts — uyarı varsa e-posta + Telegram (saatlik limit) */
export async function dealerPostFinanceSendAlerts(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = getAuthUserId(req);
    const profile = await repoGetDealerProfile(userId);
    if (!profile) return sendNotFound(reply);

    const result = await sendDealerFinanceAlerts(userId);
    if (result.reason === 'rate_limited') {
      return reply.code(429).send(result);
    }
    return reply.send(result);
  } catch (e) {
    return handleRouteError(reply, req, e, 'dealer_finance_send_alerts');
  }
}

/** GET /dealer/finance/statement.pdf — son 500 hareket PDF */
export async function dealerGetFinanceStatementPdf(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = getAuthUserId(req);
    const profile = await repoGetDealerProfile(userId);
    if (!profile) return sendNotFound(reply);

    const rows = await repoListTransactions({
      dealer_id: profile.id,
      page: 1,
      limit: 500,
      offset: 0,
    });

    const buf = await buildDealerStatementPdf({
      companyName: profile.company_name ?? 'Bayi',
      transactions: rows as DealerTransactionRow[],
    });

    return reply
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', 'attachment; filename="cari-ekstre.pdf"')
      .send(buf);
  } catch (e) {
    return handleRouteError(reply, req, e, 'dealer_finance_statement_pdf');
  }
}

/** GET /dealer/transactions — paginated list */
export async function dealerListMyTransactions(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = getAuthUserId(req);
    const profile = await repoGetDealerProfile(userId);
    if (!profile) return sendNotFound(reply);

    const query = req.query as Record<string, string>;
    const parsed = transactionListQuerySchema.safeParse(query);
    if (!parsed.success) return sendValidationError(reply, parsed.error.issues);

    const { page, limit, offset } = parsePage(query);
    const filterParams: TransactionFilterParams = {
      dealer_id: profile.id,
      type: parsed.data.type,
      date_from: parsed.data.date_from,
      date_to: parsed.data.date_to,
      due_from: parsed.data.due_from,
      due_to: parsed.data.due_to,
    };

    const [rows, total] = await Promise.all([
      repoListTransactions({ ...filterParams, page, limit, offset }),
      repoCountTransactions(filterParams),
    ]);

    setContentRange(reply, offset, limit, total);
    return reply.send({ data: rows, total, page, limit });
  } catch (e) {
    return handleRouteError(reply, req, e, 'dealer_list_transactions');
  }
}
