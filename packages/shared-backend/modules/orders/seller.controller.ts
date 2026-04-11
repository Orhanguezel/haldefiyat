// src/modules/orders/seller.controller.ts
import type { FastifyRequest, FastifyReply } from 'fastify';
import {
  getAuthUserId,
  parsePage,
  sendNotFound,
  sendValidationError,
  sendForbidden,
  handleRouteError,
  setContentRange,
} from '@agro/shared-backend/modules/_shared';
import { repoUserIsDealer } from '../sellers/repository';
import { calculateCarrierPayout, getCommissionRate } from '../wallet/commission';
import { orderListQuerySchema } from './validation';
import type { OrderStatus } from './schema';
import {
  repoListOrders,
  repoCountOrders,
  repoGetOrderById,
  repoSellerOrdersAggregate,
} from './repository';

async function requireSeller(reply: FastifyReply, userId: string): Promise<boolean> {
  const ok = await repoUserIsDealer(userId);
  if (!ok) {
    sendForbidden(reply);
    return false;
  }
  return true;
}

/** GET /seller/orders/summary — dashboard: durum bazlı adet + komisyon tahmini */
export async function sellerOrdersSummary(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = getAuthUserId(req);
    if (!(await requireSeller(reply, userId))) return;

    const rows = await repoSellerOrdersAggregate(userId);
    const commissionCfg = await getCommissionRate();
    let grossTotal = 0;
    const order_count_by_status: Record<string, number> = {};
    for (const r of rows) {
      order_count_by_status[r.status] = Number(r.count ?? 0);
      grossTotal += parseFloat(String(r.total_sum ?? 0));
    }
    const { commissionAmount, carrierPayout } = calculateCarrierPayout(grossTotal, commissionCfg.rate);

    return reply.send({
      order_count_by_status,
      gross_total: grossTotal,
      commission_rate_percent: commissionCfg.rate,
      estimated_platform_commission: commissionAmount,
      estimated_seller_payout: carrierPayout,
    });
  } catch (e) {
    return handleRouteError(reply, req, e, 'seller_orders_summary');
  }
}

/** GET /seller/orders — satıcıya atanmış siparişler */
export async function sellerListOrders(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = getAuthUserId(req);
    if (!(await requireSeller(reply, userId))) return;

    const raw = req.query as Record<string, string>;
    const parsed = orderListQuerySchema.omit({ seller_id: true }).safeParse(raw);
    if (!parsed.success) return sendValidationError(reply, parsed.error.issues);

    const { page, limit, offset } = parsePage(raw);
    const filter = {
      seller_id: userId,
      status: parsed.data.status as OrderStatus | undefined,
      date_from: parsed.data.date_from,
      date_to: parsed.data.date_to,
    };

    const [total, rows] = await Promise.all([
      repoCountOrders(filter),
      repoListOrders({ ...filter, limit, offset }),
    ]);

    setContentRange(reply, offset, limit, total);
    return reply.send({ data: rows, total, page, limit });
  } catch (e) {
    return handleRouteError(reply, req, e, 'seller_list_orders');
  }
}

/** GET /seller/orders/:id */
export async function sellerGetOrder(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = getAuthUserId(req);
    if (!(await requireSeller(reply, userId))) return;

    const { id } = req.params as { id: string };
    const order = await repoGetOrderById(id);
    if (!order || order.seller_id !== userId) return sendNotFound(reply);

    return reply.send(order);
  } catch (e) {
    return handleRouteError(reply, req, e, 'seller_get_order');
  }
}
