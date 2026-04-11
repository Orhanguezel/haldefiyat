// src/modules/wallet/router.ts
import type { FastifyInstance } from "fastify";
import * as controller from "./controller";
import { requireAuth } from "@agro/shared-backend/middleware/auth";
import { authSecurity, fromZodSchema, okResponseSchema } from "@agro/shared-backend/modules/_shared";
import { z } from "zod";
import { depositSchema, initiateDepositSchema } from "./validation";

export async function registerWallet(app: FastifyInstance) {
  const B = "/wallet";
  const auth = { preHandler: [requireAuth] };
  const walletTransactionsQuerySchema = fromZodSchema(z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
    type: z.enum(['credit', 'debit']).optional(),
    purpose: z.string().optional(),
  }), 'WalletTransactionsQuery');
  const callbackBodySchema = fromZodSchema(z.object({
    token: z.string().min(1),
    status: z.string().optional(),
    conversationId: z.string().optional(),
  }), 'WalletCallbackBody');

  app.get(`${B}`, {
    ...auth,
    schema: { tags: ['wallet'], summary: 'Kullanici cuzdani', security: authSecurity, response: { 200: okResponseSchema } },
  }, controller.getMyWallet);
  app.get(`${B}/transactions`, {
    ...auth,
    schema: { tags: ['wallet'], summary: 'Cuzdan hareketleri', security: authSecurity, querystring: walletTransactionsQuerySchema, response: { 200: okResponseSchema } },
  }, controller.listMyTransactions);

  // İyzico ödeme akışı
  app.post(`${B}/deposit/initiate`, {
    preHandler: [requireAuth],
    config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    schema: { tags: ['wallet'], summary: 'Iyzico odeme baslat', security: authSecurity, body: fromZodSchema(initiateDepositSchema, 'InitiateDepositBody'), response: { 200: okResponseSchema } },
  }, controller.initiateDeposit);
  app.post(`${B}/deposit/callback`, {
    schema: { tags: ['wallet'], summary: 'Iyzico callback', body: callbackBodySchema, response: { 200: okResponseSchema } },
  }, controller.iyzicoCallback); // public — İyzico'dan gelir
  app.post(`${B}/deposit/paytr-callback`, controller.payTRDepositCallback);

  // Dev-mode: doğrudan bakiye yükleme (sadece development ortamında)
  if (process.env.NODE_ENV === "development") {
    app.post(`${B}/deposit/dev`, {
      preHandler: [requireAuth],
      schema: { tags: ['wallet'], summary: 'DEV: Direkt bakiye yukle (sadece development)', security: authSecurity, body: fromZodSchema(depositSchema, 'DevDepositBody'), response: { 200: okResponseSchema } },
    }, controller.depositWallet);
  }
}
