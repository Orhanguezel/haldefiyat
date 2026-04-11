// src/modules/categories/index.ts
// External module surface. Keep explicit; no export *.

export { registerCategoriesAdmin } from './admin.routes';

export {
  adminListCategories,
  adminGetCategory,
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
  adminReorderCategories,
  adminToggleCategoryActive,
  adminToggleCategoryFeatured,
  adminSetCategoryImage,
} from './admin.controller';

export {
  repoListCategories,
  repoGetCategoryById,
  repoCreateCategory,
  repoUpdateCategory,
  repoDeleteCategory,
  repoToggleCategoryActive,
  repoToggleCategoryFeatured,
  repoUpdateCategoryOrder,
  repoSetCategoryImage,
} from './repository';

export {
  createCategorySchema,
  updateCategorySchema,
  listCategoriesSchema,
} from './validation';

export {
  categories,
  categoryI18n,
} from './schema';
export type {
  Category,
  NewCategory,
  CategoryI18n,
  NewCategoryI18n,
} from './schema';
