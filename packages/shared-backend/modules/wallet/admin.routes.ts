// =============================================================
// FILE: src/modules/wallet/admin.routes.ts
// =============================================================
import type { FastifyInstance } from 'fastify';
import {
  adminListWallets,
  adminGetWallet,
  adminUpdateWalletStatus,
  adminAdjustWallet,
  adminListTransactions,
  adminUpdateTransactionStatus,
} from './admin.controller';

export async function registerWalletAdmin(app: FastifyInstance) {
  const B = '/wallets';
  app.get(B, adminListWallets);
  app.get(`${B}/:id`, adminGetWallet);
  app.patch(`${B}/:id/status`, adminUpdateWalletStatus);
  app.post(`${B}/adjust`, adminAdjustWallet);
  app.get(`${B}/:walletId/transactions`, adminListTransactions);
  app.patch('/wallet_transactions/:id/status', adminUpdateTransactionStatus);
}
