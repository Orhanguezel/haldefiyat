// =============================================================
// FILE: src/modules/products/routes.ts
// =============================================================
import type { FastifyInstance } from "fastify";
import {
  listProducts,
  getProductByIdOrSlug,
  getProductById,
  getProductBySlug,
  // Public lists
  listProductFaqs,
  listProductSpecs,
  listProductReviews,
  submitPublicFaq,
  submitPublicReview,
} from "./controller";
import { compareProducts } from "./compare.controller";

export async function registerProducts(app: FastifyInstance) {
  // Products: list + detail
const B = "/products";

  app.get(
    B,
    { config: { public: true } },
    listProducts,
  );
  app.get(
    `${B}/compare`,
    { config: { public: true } },
    compareProducts,
  );
  app.get(
    `${B}/:idOrSlug`,
    { config: { public: true } },
    getProductByIdOrSlug,
  );
  app.get(
    `${B}/by-slug/:slug`,
    { config: { public: true } },
    getProductBySlug,
  );
  app.get(
    `${B}/id/:id`,
    { config: { public: true } },
    getProductById,
  );

  // Public auxiliary lists
  app.get(
    `${B}/faqs`,
    { config: { public: true } },
    listProductFaqs,
  );
  app.post(
    `${B}/faqs/submit`,
    { config: { public: true } },
    submitPublicFaq,
  );
  app.get(
    `${B}/specs`,
    { config: { public: true } },
    listProductSpecs,
  );
  app.get(
    `${B}/reviews`,
    { config: { public: true } },
    listProductReviews,
  );
  app.post(
    `${B}/reviews/submit`,
    { config: { public: true } },
    submitPublicReview,
  );
}
