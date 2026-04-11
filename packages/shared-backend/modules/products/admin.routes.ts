// =============================================================
// FILE: src/modules/products/admin.routes.ts  (GÜNCEL)
// =============================================================
import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/roles';

/* Products ana controller (CRUD + images + lists) */
import {
  adminListProducts,
  adminGetProduct,
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,

  // replace (products table fields)
  adminSetProductImages,

  // reorder
  adminReorderProducts,

  // ✅ NEW: product_images pool
  adminListProductImages,
  adminCreateProductImage,
  adminDeleteProductImage,
} from './admin.controller';

/* Ayrı controller'lar */
import {
  adminListProductFaqs,
  adminCreateProductFaq,
  adminUpdateProductFaq,
  adminToggleFaqActive,
  adminDeleteProductFaq,
  adminReplaceFaqs,
} from './admin.faqs.controller';

import {
  adminListProductSpecs,
  adminCreateProductSpec,
  adminUpdateProductSpec,
  adminDeleteProductSpec,
  adminReplaceSpecs,
} from './admin.specs.controller';

import {
  adminListProductReviews,
  adminCreateProductReview,
  adminUpdateProductReview,
  adminToggleReviewActive,
  adminDeleteProductReview,
} from './admin.reviews.controller';

/* Kategori yardımcı uçları */
import { adminListCategories, adminListSubcategories } from './helpers.categoryLists';

export async function registerProductsAdmin(app: FastifyInstance) {
  const B = '/products';

  // -------- Products (CRUD) --------
  app.get(B, { preHandler: [requireAuth, requireAdmin] }, adminListProducts);

  app.get(`${B}/:id`, { preHandler: [requireAuth, requireAdmin] }, adminGetProduct);

  app.post(B, { preHandler: [requireAuth, requireAdmin] }, adminCreateProduct);

  app.patch(`${B}/:id`, { preHandler: [requireAuth, requireAdmin] }, adminUpdateProduct);

  app.delete(`${B}/:id`, { preHandler: [requireAuth, requireAdmin] }, adminDeleteProduct);

  // =============================================================
  // ✅ Images Pool (product_images)  <-- RTK'nin kullandığı uçlar
  // GET    /admin/products/:id/images
  // POST   /admin/products/:id/images
  // DELETE /admin/products/:id/images/:imageId
  // =============================================================
  app.get(
    `${B}/:id/images`,
    { preHandler: [requireAuth, requireAdmin] },
    adminListProductImages,
  );

  app.post(
    `${B}/:id/images`,
    { preHandler: [requireAuth, requireAdmin] },
    adminCreateProductImage,
  );

  app.delete(
    `${B}/:id/images/:imageId`,
    { preHandler: [requireAuth, requireAdmin] },
    adminDeleteProductImage,
  );

  // =============================================================
  // ✅ Images REPLACE (products fields)  <-- eski PUT çakışmasın diye taşındı
  // PUT /admin/products/:id/images/replace
  // =============================================================
  app.put(
    `${B}/:id/images/replace`,
    { preHandler: [requireAuth, requireAdmin] },
    adminSetProductImages,
  );

  // -------- REORDER (drag & drop sıralama kaydı) --------
  app.post(`${B}/reorder`, { preHandler: [requireAuth, requireAdmin] }, adminReorderProducts);

  // -------- Category helpers --------
  app.get(`${B}/categories`, { preHandler: [requireAuth, requireAdmin] }, adminListCategories);

  app.get(
    `${B}/subcategories`,
    { preHandler: [requireAuth, requireAdmin] },
    adminListSubcategories,
  );

  // -------- FAQs --------
  app.get(`${B}/:id/faqs`, { preHandler: [requireAuth, requireAdmin] }, adminListProductFaqs);

  app.post(`${B}/:id/faqs`, { preHandler: [requireAuth, requireAdmin] }, adminCreateProductFaq);

  app.patch(
    `${B}/:id/faqs/:faqId`,
    { preHandler: [requireAuth, requireAdmin] },
    adminUpdateProductFaq,
  );

  app.patch(
    `${B}/:id/faqs/:faqId/active`,
    { preHandler: [requireAuth, requireAdmin] },
    adminToggleFaqActive,
  );

  app.delete(
    `${B}/:id/faqs/:faqId`,
    { preHandler: [requireAuth, requireAdmin] },
    adminDeleteProductFaq,
  );

  app.put(`${B}/:id/faqs`, { preHandler: [requireAuth, requireAdmin] }, adminReplaceFaqs); // replace

  // -------- SPECS --------
  app.get(`${B}/:id/specs`, { preHandler: [requireAuth, requireAdmin] }, adminListProductSpecs);

  app.post(
    `${B}/:id/specs`,
    { preHandler: [requireAuth, requireAdmin] },
    adminCreateProductSpec,
  );

  app.patch(
    `${B}/:id/specs/:specId`,
    { preHandler: [requireAuth, requireAdmin] },
    adminUpdateProductSpec,
  );

  app.delete(
    `${B}/:id/specs/:specId`,
    { preHandler: [requireAuth, requireAdmin] },
    adminDeleteProductSpec,
  );

  app.put(`${B}/:id/specs`, { preHandler: [requireAuth, requireAdmin] }, adminReplaceSpecs); // replace

  // -------- REVIEWS --------
  app.get(
    `${B}/:id/reviews`,
    { preHandler: [requireAuth, requireAdmin] },
    adminListProductReviews,
  );

  app.post(
    `${B}/:id/reviews`,
    { preHandler: [requireAuth, requireAdmin] },
    adminCreateProductReview,
  );

  app.patch(
    `${B}/:id/reviews/:reviewId`,
    { preHandler: [requireAuth, requireAdmin] },
    adminUpdateProductReview,
  );

  app.patch(
    `${B}/:id/reviews/:reviewId/active`,
    { preHandler: [requireAuth, requireAdmin] },
    adminToggleReviewActive,
  );

  app.delete(
    `${B}/:id/reviews/:reviewId`,
    { preHandler: [requireAuth, requireAdmin] },
    adminDeleteProductReview,
  );
}
