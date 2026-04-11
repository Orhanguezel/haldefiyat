// =============================================================
// FILE: src/modules/products/admin.reviews.controller.ts
// =============================================================
import type { RouteHandler } from "fastify";
import { db } from "../../db/client";
import { and, asc, desc, eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { products, productReviews } from "./schema";
import {
  productReviewCreateSchema,
  productReviewUpdateSchema,
} from "./validation";

const now = () => new Date();

/** (opsiyonel) Liste — FE ihtiyaç duyarsa kullanılabilir */
export const adminListProductReviews: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const q = (req.query || {}) as {
    only_active?: string | number | boolean;
    order?: "asc" | "desc";
  };
  const conds = [eq(productReviews.product_id, id)];
  if (q.only_active !== undefined) {
    const v = String(q.only_active).toLowerCase();
    conds.push(
      eq(productReviews.is_active, (v === "1" || v === "true") as any),
    );
  }
  const orderBy =
    q.order === "asc"
      ? asc(productReviews.review_date)
      : desc(productReviews.review_date);
  const rows = await db
    .select()
    .from(productReviews)
    .where(and(...conds))
    .orderBy(orderBy);
  return reply.send(rows);
};

export const adminCreateProductReview: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  try {
    const [p] = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.id, id))
      .limit(1);
    if (!p)
      return reply
        .code(404)
        .send({ error: { message: "product_not_found" } });

    const input = productReviewCreateSchema.parse({
      ...(req.body || {}),
      product_id: id,
    });
    const row: any = {
      ...input,
      id: input.id ?? randomUUID(),
      is_active: input.is_active ?? true,
      review_date: input.review_date
        ? new Date(input.review_date)
        : now(),
      created_at: now(),
      updated_at: now(),
    };
    await db.insert(productReviews).values(row);
    return reply.code(201).send(row);
  } catch (e: any) {
    if (e?.name === "ZodError")
      return reply
        .code(422)
        .send({ error: { message: "validation_error", details: e.issues } });
    req.log.error(e);
    return reply
      .code(500)
      .send({ error: { message: "internal_error" } });
  }
};

export const adminUpdateProductReview: RouteHandler = async (req, reply) => {
  const { id, reviewId } = req.params as {
    id: string;
    reviewId: string;
  };
  try {
    const patch = productReviewUpdateSchema.parse({
      ...(req.body || {}),
      product_id: id,
    });
    const upd: any = { ...patch, updated_at: now() };
    if (patch.review_date !== undefined) {
      upd.review_date = patch.review_date
        ? new Date(patch.review_date)
        : null;
    }
    await db
      .update(productReviews)
      .set(upd)
      .where(
        and(
          eq(productReviews.id, reviewId),
          eq(productReviews.product_id, id),
        ),
      );
    const [row] = await db
      .select()
      .from(productReviews)
      .where(eq(productReviews.id, reviewId))
      .limit(1);
    if (!row)
      return reply
        .code(404)
        .send({ error: { message: "not_found" } });
    return reply.send(row);
  } catch (e: any) {
    if (e?.name === "ZodError")
      return reply
        .code(422)
        .send({ error: { message: "validation_error", details: e.issues } });
    req.log.error(e);
    return reply
      .code(500)
      .send({ error: { message: "internal_error" } });
  }
};

export const adminToggleReviewActive: RouteHandler = async (req, reply) => {
  const { id, reviewId } = req.params as {
    id: string;
    reviewId: string;
  };
  const v = !!(req.body as any)?.is_active;
  await db
    .update(productReviews)
    .set({ is_active: v, updated_at: now() } as any)
    .where(
      and(
        eq(productReviews.id, reviewId),
        eq(productReviews.product_id, id),
      ),
    );
  const [row] = await db
    .select()
    .from(productReviews)
    .where(eq(productReviews.id, reviewId))
    .limit(1);
  if (!row)
    return reply
      .code(404)
      .send({ error: { message: "not_found" } });
  return reply.send({ ok: true });
};

export const adminDeleteProductReview: RouteHandler = async (req, reply) => {
  const { id, reviewId } = req.params as {
    id: string;
    reviewId: string;
  };
  await db
    .delete(productReviews)
    .where(
      and(
        eq(productReviews.id, reviewId),
        eq(productReviews.product_id, id),
      ),
    );
  return reply.send({ ok: true });
};
