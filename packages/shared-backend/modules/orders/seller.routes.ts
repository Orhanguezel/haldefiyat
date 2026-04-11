// src/modules/orders/seller.routes.ts
import type { FastifyInstance } from 'fastify';
import { requireAuth } from '@agro/shared-backend/middleware/auth';
import {
  sellerOrdersSummary,
  sellerListOrders,
  sellerGetOrder,
} from './seller.controller';

export async function registerSellerOrders(app: FastifyInstance) {
  const B = '/seller/orders';
  app.get(`${B}/summary`, { preHandler: [requireAuth] }, sellerOrdersSummary);
  app.get(B, { preHandler: [requireAuth] }, sellerListOrders);
  app.get(`${B}/:id`, { preHandler: [requireAuth] }, sellerGetOrder);
}
