// src/modules/orders/admin.routes.ts
import type { FastifyInstance } from 'fastify';
import {
  adminListOrders,
  adminGetOrder,
  adminAssignOrderSeller,
  adminUpdateOrderStatus,
  adminDeleteOrder,
  adminListPaymentAttempts,
  adminGetPaymentAttempt,
  adminRefundOrder,
} from './admin.controller';

export async function registerOrdersAdmin(app: FastifyInstance) {
  const B = '/orders';
  app.get(`${B}/payment-attempts`, adminListPaymentAttempts);
  app.get(`${B}/payment-attempts/:paymentRef`, adminGetPaymentAttempt);
  app.get(B, adminListOrders);
  app.get(`${B}/:id`, adminGetOrder);
  app.patch(`${B}/:id/seller`, adminAssignOrderSeller);
  app.patch(`${B}/:id/status`, adminUpdateOrderStatus);
  app.post(`${B}/:id/refund`, adminRefundOrder);
  app.delete(`${B}/:id`, adminDeleteOrder);
}
