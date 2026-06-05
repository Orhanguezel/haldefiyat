import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { handleRouteError } from "@agro/shared-backend/modules/_shared";
import { DEFAULT_FEATURED_PRICING, readFeaturedPricing, writeFeaturedPricing, type FeaturedPricing } from "./settings";

const pkgSchema = z.object({ days: z.coerce.number().int().positive(), price: z.coerce.number().min(0) });
const pricingSchema = z.object({ daily: pkgSchema, weekly: pkgSchema, monthly: pkgSchema });

export async function getFeaturedPricing(req: FastifyRequest, reply: FastifyReply) {
  try {
    return reply.send({ pricing: (await readFeaturedPricing()) ?? DEFAULT_FEATURED_PRICING });
  } catch (err) {
    return handleRouteError(reply, req, err, "get_featured_pricing");
  }
}

export async function updateFeaturedPricing(req: FastifyRequest, reply: FastifyReply) {
  try {
    const pricing = pricingSchema.parse(req.body ?? {}) as FeaturedPricing;
    await writeFeaturedPricing(pricing);
    return reply.send({ pricing });
  } catch (err) {
    return handleRouteError(reply, req, err, "update_featured_pricing");
  }
}
