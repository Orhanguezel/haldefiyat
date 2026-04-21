'use client';

// =============================================================
// FILE: src/components/common/admin-image-upload-field.tsx
// Admin Image Upload Field (App Router + shadcn)
// - Multiple preview: one image per row
// - Cover cannot be removed
// - Library batch selection with "Add Selected" button
// - SVG preview support (+ Cloudinary sanitize) + ICO
// =============================================================

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Copy, Image as ImageIcon, Library, Star, Trash2, Upload } from 'lucide-react';

import { useCreateAssetAdminMutation, useListAssetsAdminQuery } from '@/integrations/hooks';
import { resolveMediaUrl } from '@/lib/media-url';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  appendUniqueUploadUrls,
  getDisplayUploadUrl,
  getUploadPreviewRatio,
  isSvgUploadUrl,
  normalizeUploadValue,
  sanitizeCloudinarySvgUrl,
  toUploadMetadata,
  type AdminImageUploadFieldProps,
} from '@/integrations/shared';
import { useAdminT } from '@/app/(main)/admin/_components/common/use-admin-t';

export type { AdminImageUploadFieldProps } from '@/integrations/shared/admin-image-upload';

/* ------------------------------------------------------------------ */
/* URL line with copy button                                          */
/* ------------------------------------------------------------------ */
const UrlLine: React.FC<{ url: string; disabled?: boolean }> = ({ url, disabled }) => {
  const t = useAdminT('admin.common.imageUpload');
  const safe = normalizeUploadValue(url);
  if (!safe) return null;

  const shown = getDisplayUploadUrl(safe, 80);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(safe);
      toast.success(t('messages.urlCopied'));
    } catch {
      toast.error(t('messages.copyError'));
    }
  };

  return (
    <div className="mt-2 flex min-w-0 items-center gap-2">
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs text-muted-foreground" title={safe}>
          {shown}
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={copy}
        disabled={disabled}
        title={t('actions.copy')}
      >
        <Copy className="mr-2 size-4" />
        {t('actions.copy')}
      </Button>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Client-side image dimension resolver                               */
/* ------------------------------------------------------------------ */
function useImageDimensions(
  assets: Array<{ id: string; url?: string | null; width?: number | null; height?: number | null }>,
) {
  const [dims, setDims] = useState<Record<string, { w: number; h: number }>>({});

  useEffect(() => {
    for (const a of assets) {
      if (a.width && a.height) continue;
      const url = normalizeUploadValue(a.url);
      if (!url || dims[a.id]) continue;
      const img = new window.Image();
      img.onload = () => {
        setDims((prev) => ({ ...prev, [a.id]: { w: img.naturalWidth, h: img.naturalHeight } }));
      };
      img.src = url;
    }
  }, [assets, dims]);

  return (id: string, dbW?: number | null, dbH?: number | null) => {
    if (dbW && dbH) return { w: dbW, h: dbH };
    return dims[id] || null;
  };
}

/* ------------------------------------------------------------------ */
/* Library grid (extracted for useImageDimensions hook)                */
/* ------------------------------------------------------------------ */
function LibraryGrid({
  assets,
  gallery,
  librarySelection,
  multiple,
  value,
  busy,
  onSelect,
}: {
  assets: any[];
  gallery: string[];
  librarySelection: string[];
  multiple: boolean;
  value?: string;
  busy: boolean;
  onSelect: (url: string) => void;
}) {
  const t = useAdminT('admin.common.imageUpload');
  const getDims = useImageDimensions(assets);

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
      {assets.map((asset) => {
        const rawUrl = asset.url || '';
        const resolvedUrl = resolveMediaUrl(rawUrl);
        const normalizedUrl = normalizeUploadValue(rawUrl);
        const isInGallery = gallery.includes(normalizedUrl);
        const isInSelection = librarySelection.includes(normalizedUrl);
        const isSelected = multiple ? isInSelection : value === rawUrl;
        const dims = getDims(asset.id, asset.width, asset.height);

        return (
          <button
            key={asset.id}
            type="button"
            onClick={() => onSelect(rawUrl)}
            disabled={busy || isInGallery}
            className={cn(
              'group relative overflow-hidden rounded-lg border transition-all hover:border-primary',
              isSelected && 'border-primary ring-2 ring-primary/20',
              isInGallery && 'opacity-50',
            )}
          >
            <AspectRatio ratio={1}>
              <img
                src={resolvedUrl}
                alt={asset.name || 'Asset'}
                className="size-full object-cover transition-transform group-hover:scale-105"
              />
            </AspectRatio>
            {isInGallery && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Badge variant="secondary">{t('library.alreadyAdded') || 'Eklendi'}</Badge>
              </div>
            )}
            {isSelected && !isInGallery && (
              <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                <Badge>{t('library.selected')}</Badge>
              </div>
            )}
            {multiple && isInSelection && (
              <div className="absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                ✓
              </div>
            )}
            {dims && (
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                {dims.w}&times;{dims.h}px
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main component                                                     */
/* ------------------------------------------------------------------ */
export const AdminImageUploadField: React.FC<AdminImageUploadFieldProps> = ({
  label,
  helperText,
  bucket = 'default',
  folder = 'uploads',
  metadata,

  value,
  onChange,
  onSelectAsset,

  values,
  onChangeMultiple,
  onSelectAsCover,
  coverValue,

  disabled,
  multiple = false,

  previewAspect = '16x9',
  previewObjectFit = 'cover',
}) => {
  const t = useAdminT('admin.common.imageUpload');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [createAssetAdmin, { isLoading: isUploading }] = useCreateAssetAdminMutation();

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'library'>('upload');
  const [librarySelection, setLibrarySelection] = useState<string[]>([]);

  // Fetch library assets (all folders, 200 items at once)
  const {
    data: assetsData,
    isLoading: isLoadingAssets,
    isError: isAssetsError,
    error: assetsError,
  } = useListAssetsAdminQuery(
    { limit: 200, sort: 'created_at', order: 'desc' },
    { skip: !isModalOpen || activeTab !== 'library' },
  );

  // Auto-add selected images when modal closes
  const handleModalOpenChange = (open: boolean) => {
    if (!open && multiple && librarySelection.length > 0) {
      if (onChangeMultiple) {
        onChangeMultiple(appendUniqueUploadUrls(gallery, librarySelection));
        toast.success(
          librarySelection.length === 1
            ? t('messages.imageAdded')
            : t('messages.multipleImagesUploaded', { count: String(librarySelection.length) }),
        );
      }
      setLibrarySelection([]);
    }
    setIsModalOpen(open);
  };

  const meta = useMemo(() => toUploadMetadata(metadata), [metadata]);
  const gallery = useMemo(
    () => (Array.isArray(values) ? [...new Set(values.map(normalizeUploadValue).filter(Boolean))] : []),
    [values],
  );

  const busy = !!disabled || isUploading;

  const handlePickClick = () => {
    if (busy) return;
    setActiveTab('upload');
    setLibrarySelection([]);
    setIsModalOpen(true);
  };

  const handleDirectFileSelect = () => {
    fileInputRef.current?.click();
  };

  // In multiple mode: toggle selection. In single mode: select immediately.
  const handleSelectFromLibrary = (url: string) => {
    if (!url) return;

    if (multiple) {
      setLibrarySelection((prev) => {
        const normalized = normalizeUploadValue(url);
        if (prev.includes(normalized)) {
          return prev.filter((u) => u !== normalized);
        }
        return [...prev, normalized];
      });
      return;
    }

    if (onChange) {
      onChange(url);
      toast.success(t('messages.imageSelected'));
    }
    setIsModalOpen(false);
  };

  // Bulk add from library selection
  const handleAddSelectedFromLibrary = () => {
    if (!librarySelection.length) return;

    if (onChangeMultiple) {
      onChangeMultiple(appendUniqueUploadUrls(gallery, librarySelection));
      toast.success(
        librarySelection.length === 1
          ? t('messages.imageAdded')
          : t('messages.multipleImagesUploaded', { count: String(librarySelection.length) }),
      );
    } else if (onChange && librarySelection[0]) {
      onChange(librarySelection[0]);
      toast.success(t('messages.imageSelected'));
    }

    setLibrarySelection([]);
    setIsModalOpen(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (!files.length) return;

    if (!multiple) {
      const file = files[0];

      // SVG MIME type fix
      let uploadFile: File = file;
      if (file.name.toLowerCase().endsWith('.svg') && file.type !== 'image/svg+xml') {
        uploadFile = new File([file], file.name, { type: 'image/svg+xml' });
      }

      try {
        const res = await createAssetAdmin({
          file: uploadFile,
          bucket,
          folder,
          metadata: meta,
        } as any).unwrap();
        const url = normalizeUploadValue((res as any)?.url);
        const assetId = normalizeUploadValue((res as any)?.id) || null;
        if (!url) throw new Error(t('messages.urlMissing'));
        onChange?.(url);
        onSelectAsset?.({ url, assetId });
        toast.success(t('messages.imageUploaded'));
        setIsModalOpen(false);
      } catch (err: any) {
        const msg =
          err?.data?.error?.message ||
          err?.data?.message ||
          err?.error ||
          err?.message ||
          t('messages.uploadError');
        toast.error(typeof msg === 'string' ? msg : t('messages.uploadError'));
      }
      return;
    }

    // Multiple file upload
    const uploadedUrls: string[] = [];
    let successCount = 0;

    for (const file of files) {
      let uploadFile: File = file;
      if (file.name.toLowerCase().endsWith('.svg') && file.type !== 'image/svg+xml') {
        uploadFile = new File([file], file.name, { type: 'image/svg+xml' });
      }

      try {
        const res = await createAssetAdmin({
          file: uploadFile,
          bucket,
          folder,
          metadata: meta,
        } as any).unwrap();
        const url = normalizeUploadValue((res as any)?.url);
        if (url) {
          uploadedUrls.push(url);
          successCount += 1;
        }
      } catch (err: any) {
        console.error('[AdminImageUpload] bulk upload failed:', JSON.stringify(err, null, 2), err);
        const emsg =
          err?.data?.error?.message ||
          err?.data?.message ||
          err?.error ||
          err?.message ||
          t('messages.bulkUploadError');
        toast.error(typeof emsg === 'string' ? emsg : t('messages.bulkUploadError'));
      }
    }

    if (successCount > 0) {
      if (onChangeMultiple) {
        onChangeMultiple(appendUniqueUploadUrls(gallery, uploadedUrls));
      } else {
        onChange?.(uploadedUrls[0]);
      }
      toast.success(
        successCount === 1
          ? t('messages.imageUploaded')
          : t('messages.multipleImagesUploaded', { count: String(successCount) }),
      );
      setIsModalOpen(false);
    }
  };

  const removeAt = (idx: number) => {
    if (!onChangeMultiple) return;

    const url = gallery[idx];
    const isCover = !!coverValue && normalizeUploadValue(coverValue) === url;

    if (isCover) {
      toast.error(t('messages.cannotRemoveCover'));
      return;
    }
    onChangeMultiple(gallery.filter((_, i) => i !== idx));
  };

  const aspect = getUploadPreviewRatio(previewAspect);

  const SinglePreview = () => {
    if (!value) {
      return (
        <div className="rounded-md border bg-muted/20 p-3 text-center text-sm text-muted-foreground">
          {t('empty.single')}
        </div>
      );
    }

    const svg = isSvgUploadUrl(value);
    const previewUrlRaw = svg ? sanitizeCloudinarySvgUrl(value) : value;
    const previewUrl = resolveMediaUrl(previewUrlRaw);

    return (
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground">{t('preview.title')}</div>

        <div className="overflow-hidden rounded-md border bg-background">
          <AspectRatio ratio={aspect}>
            {svg ? (
              <object
                data={previewUrl}
                type="image/svg+xml"
                className="h-full w-full"
                aria-label={t('preview.svgAria')}
              >
                <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                  {t('preview.svgOpenError')}
                </div>
              </object>
            ) : (
              <div className="relative h-full w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt={t('preview.imageAlt')}
                  className="h-full w-full"
                  style={{ objectFit: previewObjectFit }}
                  onError={(e) => {
                    const img = e.currentTarget as HTMLImageElement;
                    img.style.display = 'none';
                    const parent = img.parentElement;
                    if (parent && !parent.querySelector('.error-placeholder')) {
                      const errorDiv = document.createElement('div');
                      errorDiv.className =
                        'error-placeholder absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted/50';
                      errorDiv.innerHTML = `
                        <svg class="size-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span class="text-xs text-muted-foreground">${t('preview.imageLoadError')}</span>
                      `;
                      parent.appendChild(errorDiv);
                    }
                  }}
                />
              </div>
            )}
          </AspectRatio>
        </div>

        <div className="rounded-md border bg-muted/50 p-2">
          <div className="mb-1 text-xs font-medium text-muted-foreground">{t('preview.urlLabel')}</div>
          <code className="block wrap-break-word text-xs font-mono leading-relaxed text-foreground">
            {value}
          </code>
        </div>

        <UrlLine url={value} disabled={busy} />
      </div>
    );
  };

  const MultiPreview = () => {
    if (!gallery.length) {
      return (
        <div className="rounded-md border bg-muted/20 p-3 text-center text-sm text-muted-foreground">
          {t('empty.gallery')}
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground">{t('gallery.title')}</div>

        <div className="flex flex-col gap-2">
          {gallery.map((u, idx) => {
            const isCover = !!coverValue && normalizeUploadValue(coverValue) === u;
            const svg = isSvgUploadUrl(u);
            const previewUrlRaw = svg ? sanitizeCloudinarySvgUrl(u) : u;
            const previewUrl = resolveMediaUrl(previewUrlRaw);

            return (
              <div
                key={`${u}-${idx}`}
                className={cn('rounded-md border p-2', isCover && 'border-primary')}
              >
                <div className="flex gap-3">
                  <div className="w-35 shrink-0">
                    <div className="overflow-hidden rounded-md border bg-background">
                      <AspectRatio ratio={16 / 9}>
                        {svg ? (
                          <object
                            data={previewUrl}
                            type="image/svg+xml"
                            className="h-full w-full"
                            aria-label={t('gallery.svgImageAria', { index: String(idx + 1) })}
                          >
                            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                              {t('gallery.svgLoadError')}
                            </div>
                          </object>
                        ) : (
                          <div className="relative h-full w-full">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={previewUrl}
                              alt={t('gallery.imageAlt', { index: String(idx + 1) })}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                const img = e.currentTarget as HTMLImageElement;
                                img.style.display = 'none';
                                const parent = img.parentElement;
                                if (parent && !parent.querySelector('.error-placeholder')) {
                                  const errorDiv = document.createElement('div');
                                  errorDiv.className =
                                    'error-placeholder absolute inset-0 flex items-center justify-center bg-muted/50';
                                  errorDiv.innerHTML = `
                                    <svg class="size-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  `;
                                  parent.appendChild(errorDiv);
                                }
                              }}
                            />
                          </div>
                        )}
                      </AspectRatio>
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium" title={u}>
                          {isCover ? t('gallery.cover') : t('gallery.imageTitle', { index: String(idx + 1) })}
                        </div>
                        {isCover ? (
                          <Badge variant="secondary" className="mt-1">
                            {t('gallery.cover')}
                          </Badge>
                        ) : null}
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        {onSelectAsCover ? (
                          <Button
                            type="button"
                            variant={isCover ? 'default' : 'outline'}
                            size="sm"
                            disabled={busy}
                            onClick={() => onSelectAsCover(u)}
                            title={t('actions.setCover')}
                          >
                            <Star className="mr-2 size-4" />
                            {t('gallery.cover')}
                          </Button>
                        ) : null}

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={busy || !onChangeMultiple || isCover}
                          onClick={() => removeAt(idx)}
                          title={isCover ? t('messages.cannotRemoveCoverShort') : t('actions.delete')}
                        >
                          <Trash2 className="mr-2 size-4" />
                          {t('actions.delete')}
                        </Button>
                      </div>
                    </div>

                    <UrlLine url={u} disabled={busy} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="space-y-1 pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="text-sm font-semibold">{label ?? t('label')}</div>
            {helperText ? <div className="text-xs text-muted-foreground">{helperText}</div> : null}
          </div>
          {isUploading ? <Badge variant="secondary">{t('loading')}</Badge> : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <label className="sr-only">{t('upload.srLabel')}</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.svg,.ico"
          multiple={!!multiple}
          style={{ display: 'none' }}
          onChange={handleFileChange as any}
          disabled={busy}
        />

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={handlePickClick} disabled={busy}>
            <Upload className="mr-2 size-4" />
            {multiple ? t('upload.multipleButton') : t('upload.singleButton')}
          </Button>
        </div>

        {!multiple ? <SinglePreview /> : <MultiPreview />}

        {/* Upload/Library Modal */}
        <Dialog open={isModalOpen} onOpenChange={handleModalOpenChange}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{multiple ? t('upload.multipleButton') : t('upload.singleButton')}</DialogTitle>
              <DialogDescription>
                {t('dialog.description')}
              </DialogDescription>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'upload' | 'library')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload">
                  <Upload className="mr-2 size-4" />
                  {t('tabs.upload')}
                </TabsTrigger>
                <TabsTrigger value="library">
                  <Library className="mr-2 size-4" />
                  {t('tabs.library')}
                </TabsTrigger>
              </TabsList>

              {/* Upload Tab */}
              <TabsContent value="upload" className="space-y-4">
                <div className="rounded-lg border bg-muted/20 p-6 text-center">
                  <div className="mx-auto flex max-w-md flex-col items-center gap-4">
                    <div className="rounded-full bg-primary/10 p-3">
                      <Upload className="size-8 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold">{t('upload.selectTitle')}</h3>
                      <p className="text-sm text-muted-foreground">
                        {multiple
                          ? t('upload.multipleHelp')
                          : t('upload.singleHelp')}
                      </p>
                    </div>
                    <Button type="button" onClick={handleDirectFileSelect} disabled={busy} size="lg">
                      <Upload className="mr-2 size-4" />
                      {t('upload.selectFile')}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Library Tab */}
              <TabsContent value="library" className="space-y-4">
                {isLoadingAssets ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-sm text-muted-foreground">{t('loading')}</div>
                  </div>
                ) : isAssetsError ? (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
                    <div className="mx-auto flex max-w-md flex-col items-center gap-2">
                      <h3 className="font-semibold">{t('library.loadErrorTitle')}</h3>
                      <p className="text-sm text-muted-foreground">
                        {(assetsError as any)?.data?.error?.message ||
                          (assetsError as any)?.data?.message ||
                          t('library.loadErrorDescription')}
                      </p>
                    </div>
                  </div>
                ) : !assetsData?.items?.length ? (
                  <div className="rounded-lg border bg-muted/20 p-6 text-center">
                    <div className="mx-auto flex max-w-md flex-col items-center gap-4">
                      <div className="rounded-full bg-muted p-3">
                        <ImageIcon className="size-8 text-muted-foreground" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-semibold">{t('library.emptyTitle')}</h3>
                        <p className="text-sm text-muted-foreground">
                          {t('library.emptyDescription')}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Selection bar */}
                    {multiple && librarySelection.length > 0 && (
                      <div className="flex items-center justify-between rounded-lg border bg-primary/5 p-3">
                        <span className="font-medium text-sm">
                          {librarySelection.length} {t('library.selectedCount') || 'gorsel secildi'}
                        </span>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setLibrarySelection([])}
                          >
                            {t('actions.clear') || 'Temizle'}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleAddSelectedFromLibrary}
                            disabled={busy}
                          >
                            <Upload className="mr-2 size-4" />
                            {t('actions.addSelected') || 'Ekle'} ({librarySelection.length})
                          </Button>
                        </div>
                      </div>
                    )}

                    <LibraryGrid
                      assets={assetsData.items}
                      gallery={gallery}
                      librarySelection={librarySelection}
                      multiple={multiple}
                      value={value}
                      busy={busy}
                      onSelect={handleSelectFromLibrary}
                    />

                    {/* Bottom add button */}
                    {multiple && librarySelection.length > 0 && (
                      <div className="flex justify-end pt-2">
                        <Button
                          type="button"
                          size="default"
                          onClick={handleAddSelectedFromLibrary}
                          disabled={busy}
                        >
                          <Upload className="mr-2 size-4" />
                          {t('actions.addSelected') || 'Secilenleri Ekle'} ({librarySelection.length})
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default AdminImageUploadField;
