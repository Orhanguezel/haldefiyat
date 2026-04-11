// =============================================================
// FILE: src/modules/wallet/admin.controller.ts
// Admin wallet handlers
// =============================================================
import type { FastifyRequest, FastifyReply } from 'fastify';
import { handleRouteError } from '@agro/shared-backend/modules/_shared';
import { adminAdjustSchema, adminStatusSchema, adminTransactionStatusSchema } from './validation';
import {
  repoAdminListWallets,
  repoAdminGetWallet,
  repoAdminUpdateWalletStatus,
  repoAdminAdjustWallet,
  repoAdminListTransactions,
  repoAdminUpdateTransactionStatus,
} from './admin.repository';
import { parseAdminWalletPaging } from './helpers';

/** GET /admin/wallets */
export async function adminListWallets(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { page: pageNum, limit: limitNum, offset } = parseAdminWalletPaging(req.query as Record<string, string>);

    const result = await repoAdminListWallets({ limit: limitNum, offset });

    reply.header('x-total-count', String(result.total));
    return reply.send({ data: result.data, page: pageNum, limit: limitNum, total: result.total });
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_list_wallets');
  }
}

/** GET /admin/wallets/:id */
export async function adminGetWallet(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const wallet = await repoAdminGetWallet(id);
    if (!wallet) return reply.code(404).send({ error: 'Wallet not found' });
    return reply.send(wallet);
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_get_wallet');
  }
}

/** PATCH /admin/wallets/:id/status */
export async function adminUpdateWalletStatus(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const { status } = adminStatusSchema.parse(req.body ?? {});
    await repoAdminUpdateWalletStatus(id, status);
    return reply.send({ success: true });
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_update_wallet_status');
  }
}

/** POST /admin/wallets/adjust */
export async function adminAdjustWallet(req: FastifyRequest, reply: FastifyReply) {
  try {
    const data = adminAdjustSchema.parse(req.body ?? {});
    const txId = await repoAdminAdjustWallet(data);
    return reply.send({ success: true, transaction_id: txId });
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_adjust_wallet');
  }
}

/** GET /admin/wallets/:walletId/transactions */
export async function adminListTransactions(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { walletId } = req.params as { walletId: string };
    const { page: pageNum, limit: limitNum, offset } = parseAdminWalletPaging(req.query as Record<string, string>);

    const result = await repoAdminListTransactions(walletId, { limit: limitNum, offset });

    reply.header('x-total-count', String(result.total));
    return reply.send({ data: result.data, page: pageNum, limit: limitNum, total: result.total });
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_list_transactions');
  }
}

/** PATCH /admin/wallet_transactions/:id/status */
export async function adminUpdateTransactionStatus(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const { payment_status } = adminTransactionStatusSchema.parse(req.body ?? {});
    const tx = await repoAdminUpdateTransactionStatus(id, payment_status);
    if (!tx) return reply.code(404).send({ error: 'Transaction not found' });
    return reply.send({ success: true });
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_update_transaction_status');
  }
}
