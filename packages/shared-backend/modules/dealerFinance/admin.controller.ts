// src/modules/dealerFinance/admin.controller.ts
import type { FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';
import {
  getAuthUserId,
  parsePage,
  handleRouteError,
  sendNotFound,
  sendValidationError,
  setContentRange,
} from '../_shared';
import {
  repoListDealerProfiles,
  repoCountDealerProfiles,
  repoGetDealerProfileById,
  repoUpdateDealerProfile,
  repoListTransactions,
  repoCountTransactions,
  repoCreateTransaction,
  repoUpdateDealerBalance,
} from './repository';
import {
  repoSumAmountsByType,
  repoCountAllTransactions,
  repoCountOverdueTransactions,
} from './repository-aggregates';
import {
  dealerProfileUpdateSchema,
  adminTransactionCreateSchema,
  transactionListQuerySchema,
  buildFinanceSummaryPayload,
  type TransactionFilterParams,
} from '@agro/shared-backend/modules/dealerFinance';

/** GET /admin/dealers — paginated list of all dealer profiles */
export async function adminListDealerProfiles(req: FastifyRequest, reply: FastifyReply) {
  try {
    const query = req.query as Record<string, string>;
    const { page, limit, offset } = parsePage(query);
    const isApproved = query.is_approved !== undefined
      ? parseInt(query.is_approved, 10)
      : undefined;

    const params = { page, limit, offset, search: query.search, is_approved: isApproved };
    const [rows, total] = await Promise.all([
      repoListDealerProfiles(params),
      repoCountDealerProfiles(params),
    ]);

    setContentRange(reply, offset, limit, total);
    return reply.send({ data: rows, total, page, limit });
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_dealer_list');
  }
}

/** GET /admin/dealers/:id/finance/summary — cari özet (admin) */
export async function adminGetDealerFinanceSummary(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const profile = await repoGetDealerProfileById(id);
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
    return handleRouteError(reply, req, e, 'admin_dealer_finance_summary');
  }
}

/** GET /admin/dealers/:id — single dealer profile */
export async function adminGetDealerProfile(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const profile = await repoGetDealerProfileById(id);
    if (!profile) return sendNotFound(reply);
    return reply.send(profile);
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_dealer_get');
  }
}

/** PATCH /admin/dealers/:id — update credit_limit, discount_rate, is_approved */
export async function adminUpdateDealerProfile(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const existing = await repoGetDealerProfileById(id);
    if (!existing) return sendNotFound(reply);

    const parsed = dealerProfileUpdateSchema.safeParse(req.body);
    if (!parsed.success) return sendValidationError(reply, parsed.error.issues);

    await repoUpdateDealerProfile(id, parsed.data);
    const updated = await repoGetDealerProfileById(id);
    return reply.send(updated);
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_dealer_update');
  }
}

/** GET /admin/dealers/:id/transactions — paginated transactions for a dealer */
export async function adminListDealerTransactions(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const existing = await repoGetDealerProfileById(id);
    if (!existing) return sendNotFound(reply);

    const query = req.query as Record<string, string>;
    const parsed = transactionListQuerySchema.safeParse(query);
    if (!parsed.success) return sendValidationError(reply, parsed.error.issues);

    const { page, limit, offset } = parsePage(query);
    const filterParams: TransactionFilterParams = {
      dealer_id: id,
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
    return handleRouteError(reply, req, e, 'admin_dealer_transactions_list');
  }
}

/** POST /admin/dealers/:id/transactions — manual adjustment/payment */
export async function adminCreateTransaction(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const adminUserId = getAuthUserId(req);

    const dealer = await repoGetDealerProfileById(id);
    if (!dealer) return sendNotFound(reply);

    const parsed = adminTransactionCreateSchema.safeParse(req.body);
    if (!parsed.success) return sendValidationError(reply, parsed.error.issues);

    const amount = parseFloat(parsed.data.amount);
    const currentBalance = parseFloat(dealer.current_balance);
    const newBalance = currentBalance + amount;

    const txId = randomUUID();
    await repoCreateTransaction({
      id: txId,
      dealer_id: id,
      order_id: parsed.data.order_id ?? null,
      type: parsed.data.type,
      amount: parsed.data.amount,
      balance_after: String(newBalance),
      description: parsed.data.description ?? null,
      due_date: parsed.data.due_date ? new Date(parsed.data.due_date) : null,
      created_by: adminUserId,
    });

    await repoUpdateDealerBalance(id, String(newBalance));

    return reply.status(201).send({
      id: txId,
      balance_after: newBalance,
    });
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_dealer_transaction_create');
  }
}
