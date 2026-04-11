// src/modules/orders/controller.ts
import type { FastifyRequest, FastifyReply } from 'fastify';

function orderLocale(req: FastifyRequest): string {
  const h = req.headers['x-locale'];
  return typeof h === 'string' && h.length >= 2 ? h.slice(0, 8) : 'tr';
}
import { randomUUID } from 'crypto';
import {
  getAuthUserId,
  parsePage,
  sendNotFound,
  sendValidationError,
  handleRouteError,
  setContentRange,
} from '../_shared';
import {
  orderCreateSchema,
  orderListQuerySchema,
  type OrderStatus,
  type NewOrderRow,
  type NewOrderItemRow,
} from '@agro/shared-backend/modules/orders';
import {
  repoListOrders,
  repoCountOrders,
  repoGetOrderById,
  repoCreateOrder,
  repoUpdateOrderStatus,
  repoGetProductPrices,
} from './repository';
import { repoGetDealerProfile } from '../dealerFinance/repository';

/* ---- GET /orders ---- */
export async function dealerListOrders(req: FastifyRequest, reply: FastifyReply) {
  try {
    const dealerId = getAuthUserId(req);
    const raw = req.query as Record<string, string>;
    const parsed = orderListQuerySchema.safeParse(raw);
    if (!parsed.success) return sendValidationError(reply, parsed.error.issues);

    const { page, limit, offset } = parsePage(raw);
    const total = await repoCountOrders({
      dealer_id: dealerId,
      status: parsed.data.status as OrderStatus | undefined,
      date_from: parsed.data.date_from,
      date_to: parsed.data.date_to,
    });

    const rows = await repoListOrders({
      dealer_id: dealerId,
      status: parsed.data.status as OrderStatus | undefined,
      date_from: parsed.data.date_from,
      date_to: parsed.data.date_to,
      limit,
      offset,
    });

    setContentRange(reply, offset, limit, total);
    return reply.send({ data: rows, total, page, limit });
  } catch (e) {
    return handleRouteError(reply, req, e, 'dealer_list_orders');
  }
}

/* ---- GET /orders/:id ---- */
export async function dealerGetOrder(req: FastifyRequest, reply: FastifyReply) {
  try {
    const dealerId = getAuthUserId(req);
    const { id } = req.params as { id: string };

    const order = await repoGetOrderById(id, orderLocale(req));
    if (!order || order.dealer_id !== dealerId) return sendNotFound(reply);

    return reply.send(order);
  } catch (e) {
    return handleRouteError(reply, req, e, 'dealer_get_order');
  }
}

/* ---- POST /orders ---- */
export async function dealerCreateOrder(req: FastifyRequest, reply: FastifyReply) {
  try {
    const dealerId = getAuthUserId(req);
    const parsed = orderCreateSchema.safeParse(req.body);
    if (!parsed.success) return sendValidationError(reply, parsed.error.issues);

    const { items: inputItems, seller_id, notes } = parsed.data;

    // Fetch real product prices from DB
    const productIds = inputItems.map((item) => item.product_id);
    const priceMap = await repoGetProductPrices(productIds);

    const profile = await repoGetDealerProfile(dealerId);
    const discountPct = profile ? parseFloat(profile.discount_rate) : 0;
    const discountFactor =
      1 - Math.min(99.99, Math.max(0, Number.isFinite(discountPct) ? discountPct : 0)) / 100;

    // Validate all products exist
    const missing = productIds.filter((pid) => !priceMap.has(pid));
    if (missing.length > 0) {
      return reply.code(400).send({
        error: { message: 'products_not_found', product_ids: missing },
      });
    }

    // Build order items with server-calculated prices
    const orderId = randomUUID();
    let orderTotal = 0;

    // quantity = gram (tam sayi); liste fiyati kg basina TRY; satir tutari = (g / 1000) * kg birim fiyat
    const orderItemRows: NewOrderItemRow[] = inputItems.map((item) => {
      const list = parseFloat(priceMap.get(item.product_id) ?? '0');
      const unitPrice = list * discountFactor;
      const totalPrice = (unitPrice * item.quantity) / 1000;
      orderTotal += totalPrice;

      return {
        id: randomUUID(),
        order_id: orderId,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: String(unitPrice),
        total_price: String(totalPrice),
      };
    });

    const orderRow: NewOrderRow = {
      id: orderId,
      dealer_id: dealerId,
      seller_id: seller_id ?? null,
      status: 'pending',
      total: String(orderTotal),
      notes: notes ?? null,
    };

    await repoCreateOrder(orderRow, orderItemRows);

    const created = await repoGetOrderById(orderId, orderLocale(req));
    return reply.code(201).send(created);
  } catch (e) {
    return handleRouteError(reply, req, e, 'dealer_create_order');
  }
}

/* ---- PATCH /orders/:id/cancel ---- */
export async function dealerCancelOrder(req: FastifyRequest, reply: FastifyReply) {
  try {
    const dealerId = getAuthUserId(req);
    const { id } = req.params as { id: string };

    const order = await repoGetOrderById(id, orderLocale(req));
    if (!order || order.dealer_id !== dealerId) return sendNotFound(reply);

    if (order.status !== 'pending') {
      return reply.code(400).send({
        error: { message: 'only_pending_orders_can_be_cancelled' },
      });
    }

    await repoUpdateOrderStatus(id, 'cancelled');
    const updated = await repoGetOrderById(id, orderLocale(req));
    return reply.send(updated);
  } catch (e) {
    return handleRouteError(reply, req, e, 'dealer_cancel_order');
  }
}
