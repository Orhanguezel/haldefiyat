// src/modules/dealerFinance/dealer-catalog.controller.ts
import type { FastifyRequest, FastifyReply } from 'fastify';
import {
  getAuthUserId,
  handleRouteError,
  sendNotFound,
  sendValidationError,
} from '../_shared';
import { repoGetDealerProfile } from './repository';
import { repoListDealerCatalog, repoCountDealerCatalog } from './dealer-catalog.repository';
import { dealerCatalogQuerySchema } from '@agro/shared-backend/modules/dealerFinance';

/** GET /dealer/products — bayi katalog + liste fiyat / indirimli birim fiyat */
export async function dealerListCatalogProducts(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = getAuthUserId(req);
    const profile = await repoGetDealerProfile(userId);
    if (!profile) return sendNotFound(reply);

    const parsed = dealerCatalogQuerySchema.safeParse(req.query ?? {});
    if (!parsed.success) return sendValidationError(reply, parsed.error.issues);

    const discount = parseFloat(profile.discount_rate);
    const discountPercent = Number.isFinite(discount) ? discount : 0;

    const [data, total] = await Promise.all([
      repoListDealerCatalog({
        locale: parsed.data.locale,
        limit: parsed.data.limit,
        offset: parsed.data.offset,
        q: parsed.data.q,
        discountPercent,
      }),
      repoCountDealerCatalog(parsed.data.locale, parsed.data.q),
    ]);

    reply.header('x-total-count', String(total));
    reply.header('access-control-expose-headers', 'x-total-count');

    return reply.send({
      data,
      total,
      discount_rate: discountPercent,
    });
  } catch (e) {
    return handleRouteError(reply, req, e, 'dealer_catalog_products');
  }
}
