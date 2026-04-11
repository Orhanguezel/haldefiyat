// src/modules/slider/repository.ts
// Barrel — read + write repo fonksiyonlari
export {
  repoListPublic,
  repoGetBySlug,
  repoListAdmin,
  repoGetById,
  type RowWithAsset,
} from './repo-read';

export {
  repoCreate,
  repoUpdate,
  repoDelete,
  repoReorder,
  repoSetStatus,
  repoSetImage,
} from './repo-write';
