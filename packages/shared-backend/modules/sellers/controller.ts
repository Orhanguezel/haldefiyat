import type { FastifyRequest, FastifyReply } from 'fastify';
import { sendNotFound, handleRouteError } from '@agro/shared-backend/modules/_shared';
import { repoGetPublicSellerById } from './repository';

export async function getPublicSeller(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const row = await repoGetPublicSellerById(id);
    if (!row) return sendNotFound(reply);
    return reply.send(row);
  } catch (e) {
    return handleRouteError(reply, req, e, 'get_public_seller');
  }
}
