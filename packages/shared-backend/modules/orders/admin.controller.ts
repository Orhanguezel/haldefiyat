// src/modules/orders/admin.controller.ts
import type { FastifyRequest, FastifyReply } from 'fastify';
import {
  getAuthUserId,
  parsePage,
  sendNotFound,
  sendValidationError,
  handleRouteError,
  setContentRange,
} from '../_shared';
import {
  orderUpdateStatusSchema,
  orderListQuerySchema,
  adminAssignOrderSellerSchema,
  orderPaymentAttemptListQuerySchema,
  adminOrderRefundSchema,
  type OrderStatus,
} from '@agro/shared-backend/modules/orders';
import {
  repoListOrders,
  repoCountOrders,
  repoGetOrderById,
  repoUpdateOrderStatus,
  repoUpdateOrderSeller,
  repoDeleteOrder,
} from './repository';
import { repoUserIsDealer } from './dealer-role.repository';
import {
  repoCountPaymentAttempts,
  repoGetPaymentAttemptByRef,
  repoListPaymentAttempts,
} from './payment-attempts.repository';
import { OrderRefundError, refundDealerCreditOrder } from './refund.service';

/* ---- GET /admin/orders ---- */
export async function adminListOrders(req: FastifyRequest, reply: FastifyReply) {
  try {
    const raw = req.query as Record<string, string>;
    const parsed = orderListQuerySchema.safeParse(raw);
    if (!parsed.success) return sendValidationError(reply, parsed.error.issues);

    const { page, limit, offset } = parsePage(raw);
    const total = await repoCountOrders({
      status: parsed.data.status as OrderStatus | undefined,
      seller_id: parsed.data.seller_id,
      date_from: parsed.data.date_from,
      date_to: parsed.data.date_to,
    });

    const rows = await repoListOrders({
      status: parsed.data.status as OrderStatus | undefined,
      seller_id: parsed.data.seller_id,
      date_from: parsed.data.date_from,
      date_to: parsed.data.date_to,
      limit,
      offset,
    });

    setContentRange(reply, offset, limit, total);
    return reply.send({ data: rows, total, page, limit });
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_list_orders');
  }
}

/* ---- GET /admin/orders/:id ---- */
export async function adminGetOrder(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const order = await repoGetOrderById(id);
    if (!order) return sendNotFound(reply);
    return reply.send(order);
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_get_order');
  }
}

/* ---- PATCH /admin/orders/:id/seller ---- */
export async function adminAssignOrderSeller(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const parsed = adminAssignOrderSellerSchema.safeParse(req.body);
    if (!parsed.success) return sendValidationError(reply, parsed.error.issues);

    const order = await repoGetOrderById(id);
    if (!order) return sendNotFound(reply);

    const { seller_id } = parsed.data;
    if (seller_id !== null) {
      const ok = await repoUserIsDealer(seller_id);
      if (!ok) {
        return reply.code(400).send({
          error: { message: 'invalid_seller', detail: 'user_must_have_dealer_role' },
        });
      }
    }

    await repoUpdateOrderSeller(id, seller_id);
    const updated = await repoGetOrderById(id);
    return reply.send(updated);
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_assign_order_seller');
  }
}

/* ---- PATCH /admin/orders/:id/status ---- */
export async function adminUpdateOrderStatus(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };

    const parsed = orderUpdateStatusSchema.safeParse(req.body);
    if (!parsed.success) return sendValidationError(reply, parsed.error.issues);

    const order = await repoGetOrderById(id);
    if (!order) return sendNotFound(reply);

    await repoUpdateOrderStatus(id, parsed.data.status);
    const updated = await repoGetOrderById(id);
    return reply.send(updated);
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_update_order_status');
  }
}

/* ---- DELETE /admin/orders/:id ---- */
export async function adminDeleteOrder(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const order = await repoGetOrderById(id);
    if (!order) return sendNotFound(reply);

    await repoDeleteOrder(id);
    return reply.code(204).send();
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_delete_order');
  }
}

export async function adminListPaymentAttempts(req: FastifyRequest, reply: FastifyReply) {
  try {
    const raw = req.query as Record<string, string>;
    const parsed = orderPaymentAttemptListQuerySchema.safeParse(raw);
    if (!parsed.success) return sendValidationError(reply, parsed.error.issues);

    const { page, limit, offset } = parsePage(raw);
    const filter = {
      order_id: parsed.data.order_id,
      provider: parsed.data.provider,
      status: parsed.data.status,
      payment_ref: parsed.data.payment_ref,
      date_from: parsed.data.date_from,
      date_to: parsed.data.date_to,
    };

    const [rows, total] = await Promise.all([
      repoListPaymentAttempts({ ...filter, limit, offset }),
      repoCountPaymentAttempts(filter),
    ]);

    setContentRange(reply, offset, limit, total);
    return reply.send({ data: rows, total, page, limit });
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_list_payment_attempts');
  }
}

export async function adminGetPaymentAttempt(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { paymentRef } = req.params as { paymentRef: string };
    const row = await repoGetPaymentAttemptByRef(paymentRef);
    if (!row) return sendNotFound(reply);
    return reply.send(row);
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_get_payment_attempt');
  }
}

export async function adminRefundOrder(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const adminUserId = getAuthUserId(req);
    const parsed = adminOrderRefundSchema.safeParse(req.body ?? {});
    if (!parsed.success) return sendValidationError(reply, parsed.error.issues);

    await refundDealerCreditOrder({
      orderId: id,
      adminUserId,
      reason: parsed.data.reason ?? null,
    });

    const updated = await repoGetOrderById(id);
    if (!updated) return sendNotFound(reply);
    return reply.send(updated);
  } catch (e) {
    if (e instanceof OrderRefundError) {
      if (e.code === 'order_not_found') return sendNotFound(reply);
      return reply.code(400).send({ error: { message: e.code } });
    }
    return handleRouteError(reply, req, e, 'admin_refund_order');
  }
}
