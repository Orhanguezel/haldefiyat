// GET /dealers/public — onaylı bayiler (harita / liste)
import type { FastifyRequest, FastifyReply } from 'fastify';
import {
  parsePage,
  handleRouteError,
  sendValidationError,
  setContentRange,
} from '../_shared';
import { publicDealersQuerySchema } from '@agro/shared-backend/modules/dealerFinance';
import { repoCountPublicDealers, repoListPublicDealers } from './repository';

function normalizeQuery(q: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!q || typeof q !== 'object') return out;
  for (const [k, v] of Object.entries(q as Record<string, unknown>)) {
    if (v === undefined || v === null) continue;
    const first = Array.isArray(v) ? v[0] : v;
    out[k] = String(first);
  }
  return out;
}

/** Migration atlanmissa MySQL 1146 — harita bos liste ile calissin, 500 vermesin */
function isMissingDealerTableError(err: unknown): boolean {
  const o = err as { errno?: number; code?: string };
  return o.errno === 1146 || o.code === 'ER_NO_SUCH_TABLE';
}

export async function listPublicDealers(req: FastifyRequest, reply: FastifyReply) {
  const raw = normalizeQuery(req.query);
  const parsed = publicDealersQuerySchema.safeParse(raw);
  if (!parsed.success) return sendValidationError(reply, parsed.error.issues);

  const { page, limit, offset } = parsePage(raw, { maxLimit: 50 });
  const filters = {
    q: parsed.data.q,
    city: parsed.data.city,
    region: parsed.data.region,
  };

  try {
    const total = await repoCountPublicDealers(filters);
    const rows = await repoListPublicDealers({
      ...filters,
      limit,
      offset,
    });

    const data = rows.map((row) => ({
      id: row.id,
      company_name: row.company_name,
      city: row.city ?? null,
      region: row.region ?? null,
      latitude: row.latitude !== null && row.latitude !== undefined ? String(row.latitude) : null,
      longitude: row.longitude !== null && row.longitude !== undefined ? String(row.longitude) : null,
      phone: row.phone ?? null,
    }));

    setContentRange(reply, offset, limit, total);
    return reply.send({ data, page, limit, total });
  } catch (e) {
    if (isMissingDealerTableError(e)) {
      setContentRange(reply, offset, limit, 0);
      return reply.send({ data: [], page, limit, total: 0 });
    }
    return handleRouteError(reply, req, e, 'dealers_public_list');
  }
}
