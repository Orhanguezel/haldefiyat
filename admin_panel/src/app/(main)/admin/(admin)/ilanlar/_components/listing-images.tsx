'use client';

import { ImagePlus, Star, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { imageSrc, MAX_IMAGES } from '../_lib/api';

type Props = {
  images: string[];
  uploading: boolean;
  onUpload: (files: FileList | null) => void;
  onRemove: (url: string) => void;
  onMakeCover: (url: string) => void;
};

export function ListingImages({ images, uploading, onUpload, onRemove, onMakeCover }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">Görseller</div>
          <p className="text-xs text-muted-foreground">
            İlk görsel kapak olur; listede ve reklamda o görünür. En fazla {MAX_IMAGES} görsel.
          </p>
        </div>
        <span className="text-xs text-muted-foreground">{images.length} / {MAX_IMAGES}</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {images.map((url, index) => (
          <figure key={url} className="group relative overflow-hidden rounded-lg border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageSrc(url)} alt="İlan görseli" className="aspect-[4/3] w-full bg-muted/40 object-cover" />
            {index === 0 ? (
              <figcaption className="absolute left-2 top-2 rounded-md bg-background/90 px-2 py-0.5 text-xs font-medium shadow-sm">
                Kapak
              </figcaption>
            ) : null}
            <div className="absolute inset-x-0 bottom-0 flex justify-between gap-2 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition group-hover:opacity-100">
              {index === 0 ? <span /> : (
                <Button size="sm" variant="secondary" onClick={() => onMakeCover(url)}>
                  <Star className="size-3.5" /> Kapak yap
                </Button>
              )}
              <Button size="sm" variant="destructive" onClick={() => onRemove(url)}>
                <X className="size-3.5" /> Kaldır
              </Button>
            </div>
          </figure>
        ))}

        {images.length < MAX_IMAGES ? (
          <label className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-sm text-muted-foreground transition hover:border-primary hover:text-foreground">
            <ImagePlus className="size-6" />
            {uploading ? 'Yükleniyor…' : 'Görsel ekle'}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={uploading}
              onChange={(event) => { onUpload(event.target.files); event.target.value = ''; }}
            />
          </label>
        ) : null}
      </div>
    </div>
  );
}
