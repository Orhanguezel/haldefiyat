import type { FastifyReply, FastifyRequest } from "fastify";
import { handleRouteError, sendNotFound } from "@agro/shared-backend/modules/_shared";
import { getListingBoard } from "./board";
import { sendOtp, verifyOtp } from "./otp";

export async function sendListingOtp(req: FastifyRequest, reply: FastifyReply) {
  try {
    const phone = (req.body as { phone?: string } | undefined)?.phone ?? "";
    const result = await sendOtp(phone);
    if (!result.ok) return reply.code(result.code).send({ error: result.error });
    return reply.send({ ok: true });
  } catch (err) {
    return handleRouteError(reply, req, err, "listing_otp_send");
  }
}

export async function verifyListingOtp(req: FastifyRequest, reply: FastifyReply) {
  try {
    const body = (req.body ?? {}) as { phone?: string; code?: string };
    const result = await verifyOtp(body.phone ?? "", body.code ?? "");
    if (!result.ok) return reply.code(result.code).send({ error: result.error });
    return reply.send({ token: result.token, phone: result.phone });
  } catch (err) {
    return handleRouteError(reply, req, err, "listing_otp_verify");
  }
}

export async function listingBoard(req: FastifyRequest, reply: FastifyReply) {
  try {
    const q = (req.query ?? {}) as { product?: string; city?: string };
    if (!q.product || !q.city) return reply.code(400).send({ error: "product_city_required" });
    const board = await getListingBoard(q.product, q.city);
    if (!board) return sendNotFound(reply);
    return reply.send(board);
  } catch (err) {
    return handleRouteError(reply, req, err, "listing_board");
  }
}
