'use client';

// =============================================================
// ImagesGalleryTab — Kapak + galeri resim yonetimi
// Products, Custom Pages vb. moduller icin ortak component
// =============================================================

import { Trash2 } from 'lucide-react';
import { AdminImageUploadField } from '@/components/common/admin-image-upload-field';
import { resolveMediaUrl } from '@/lib/media-url';
import { useAdminT } from './use-admin-t';

interface ImagesGalleryTabProps {
  coverUrl: string;
  images: string[];
  onCoverChange: (url: string) => void;
  onImagesChange: (urls: string[]) => void;
  disabled?: boolean;
  folder?: string;
}

export function ImagesGalleryTab({
  coverUrl,
  images,
  onCoverChange,
  onImagesChange,
  disabled,
  folder = 'uploads',
}: ImagesGalleryTabProps) {
  const t = useAdminT('admin.common.imagesGallery');

  const handleRemove = (idx: number) => {
    const removed = images[idx];
    const next = images.filter((_, i) => i !== idx);
    onImagesChange(next);
    if (coverUrl === removed) onCoverChange(next[0] || '');
  };

  const handleSetCover = (url: string) => {
    onCoverChange(url);
  };

  return (
    <div className="space-y-4">
      {/* Kapak Gorseli */}
      <div className="max-w-xs">
        <AdminImageUploadField
          label={t('coverLabel')}
          value={coverUrl}
          onChange={onCoverChange}
          disabled={disabled}
          folder={folder}
          previewAspect="1x1"
          previewObjectFit="contain"
        />
      </div>

      {/* Galeri Upload */}
      <AdminImageUploadField
        label={t('galleryLabel')}
        multiple
        values={images}
        onChangeMultiple={(urls) => {
          onImagesChange(urls);
          if (!coverUrl && urls.length > 0) onCoverChange(urls[0]);
        }}
        disabled={disabled}
        folder={folder}
      />

      {/* Galeri Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {images.map((url, idx) => {
            const isCover = coverUrl === url;
            return (
              <div
                key={idx}
                className={`group relative overflow-hidden rounded border ${isCover ? 'ring-2 ring-primary' : ''}`}
              >
                <img src={resolveMediaUrl(url)} alt={`${idx + 1}`} className="h-20 w-full object-cover" />
                <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/40" />
                <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  {!isCover && (
                    <button
                      type="button"
                      className="rounded bg-amber-500/90 px-1.5 py-0.5 text-[9px] text-white"
                      onClick={() => handleSetCover(url)}
                      disabled={disabled}
                    >
                      {t('cover')}
                    </button>
                  )}
                  <button
                    type="button"
                    className="rounded bg-red-600/80 p-0.5 text-white"
                    onClick={() => handleRemove(idx)}
                    disabled={disabled}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                {isCover && (
                  <div className="absolute inset-x-0 bottom-0 bg-primary/80 py-0.5 text-center text-[9px] text-primary-foreground">
                    {t('cover')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
