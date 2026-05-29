'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/storage/_components/admin-storage-client.tsx
// Admin Storage - Media library grid
// =============================================================

import * as React from 'react';
import { toast } from 'sonner';
import {
  CheckSquare,
  ClipboardCheck,
  File as FileIcon,
  Loader2,
  RefreshCcw,
  Search,
  Square,
  Trash2,
  UploadCloud,
} from 'lucide-react';

import { cn } from '@/lib/utils';

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import type { StorageAsset } from '@/integrations/shared';
import {
  ADMIN_STORAGE_ALL_OPTION,
  ADMIN_STORAGE_DEFAULT_BUCKET,
  ADMIN_STORAGE_MIME_OPTIONS,
  buildAdminStorageListQuery,
  formatAdminStorageBytes,
  getAdminStorageMimeIcon,
  getErrorMessage,
} from '@/integrations/shared';
import {
  useBulkCreateAssetsAdminMutation,
  useBulkDeleteAssetsAdminMutation,
  useCreateAssetAdminMutation,
  useDeleteAssetAdminMutation,
  useListAssetsAdminQuery,
  useListFoldersAdminQuery,
} from '@/integrations/hooks';
import { useAdminT } from '@/app/(main)/admin/_components/common/use-admin-t';

type MediaFilters = {
  search: string;
  bucket: string;
  folder: string;
  mime: string;
  page: number;
};

const PAGE_SIZE = 24;
const UPLOAD_FOLDER = 'images';

function dimensions(item: StorageAsset): string {
  if (!item.width || !item.height) return '-';
  return `${item.width} x ${item.height} px`;
}

function fileName(item: StorageAsset): string {
  return item.name || item.path.split('/').pop() || item.id;
}

async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('image_load_failed'));
    image.src = url;
  });
}

async function resizeImageAsset(item: StorageAsset, width: number): Promise<File> {
  if (!item.url) throw new Error('url_missing');
  const image = await loadImage(item.url);
  const sourceWidth = item.width || image.naturalWidth;
  const sourceHeight = item.height || image.naturalHeight;
  if (!sourceWidth || !sourceHeight) throw new Error('dimensions_missing');

  const height = Math.max(1, Math.round((sourceHeight * width) / sourceWidth));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas_unavailable');
  ctx.drawImage(image, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.86));
  if (!blob) throw new Error('resize_failed');

  const base = fileName(item).replace(/\.[^.]+$/, '').replace(/-\d+px$/, '');
  return new window.File([blob], `${base}-${width}px.webp`, { type: 'image/webp' });
}

export default function AdminStorageClient() {
  const t = useAdminT('admin.storage');

  const [filters, setFilters] = React.useState<MediaFilters>({
    search: '',
    bucket: ADMIN_STORAGE_ALL_OPTION,
    folder: ADMIN_STORAGE_ALL_OPTION,
    mime: 'image/',
    page: 1,
  });
  const [dragActive, setDragActive] = React.useState(false);
  const [bulkMode, setBulkMode] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [activeItem, setActiveItem] = React.useState<StorageAsset | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [itemToDelete, setItemToDelete] = React.useState<StorageAsset | null>(null);
  const [resizeWidth, setResizeWidth] = React.useState('');
  const [uploadProgress, setUploadProgress] = React.useState<number | null>(null);

  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const queryParams = React.useMemo(() => {
    const base = buildAdminStorageListQuery(filters);
    return {
      ...base,
      limit: PAGE_SIZE,
      offset: (filters.page - 1) * PAGE_SIZE,
    };
  }, [filters]);

  const { data: result, isLoading, isFetching, refetch } = useListAssetsAdminQuery(queryParams);
  const { data: folders = [] } = useListFoldersAdminQuery();
  const [bulkCreateAssets, bulkCreateState] = useBulkCreateAssetsAdminMutation();
  const [createAsset, createAssetState] = useCreateAssetAdminMutation();
  const [deleteAsset, deleteState] = useDeleteAssetAdminMutation();
  const [bulkDeleteAssets, bulkDeleteState] = useBulkDeleteAssetsAdminMutation();

  const items = result?.items ?? [];
  const total = result?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const loadedSize = React.useMemo(() => items.reduce((sum, item) => sum + (item.size || 0), 0), [items]);
  const busy = isLoading || bulkCreateState.isLoading || createAssetState.isLoading || deleteState.isLoading || bulkDeleteState.isLoading;
  const hasSelection = selectedIds.size > 0;

  const buckets = React.useMemo(() => {
    const set = new Set(items.map((item) => item.bucket).filter(Boolean));
    set.add(ADMIN_STORAGE_DEFAULT_BUCKET);
    return Array.from(set);
  }, [items]);

  function updateFilters(next: Partial<MediaFilters>) {
    setFilters((prev) => ({ ...prev, ...next, page: next.page ?? 1 }));
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) => {
      if (prev.size === items.length) return new Set();
      return new Set(items.map((item) => item.id));
    });
  }

  async function uploadFiles(files: FileList | File[]) {
    const accepted = Array.from(files).filter((file) => file.type.startsWith('image/'));
    if (accepted.length === 0) {
      toast.error('Yüklenecek görsel bulunamadı.');
      return;
    }

    setUploadProgress(8);
    try {
      await bulkCreateAssets({
        files: accepted,
        bucket: ADMIN_STORAGE_DEFAULT_BUCKET,
        folder: UPLOAD_FOLDER,
      }).unwrap();
      setUploadProgress(100);
      toast.success(`${accepted.length} dosya yüklendi.`);
      setTimeout(() => setUploadProgress(null), 700);
      updateFilters({ page: 1, mime: 'image/' });
      refetch();
    } catch (err) {
      setUploadProgress(null);
      toast.error(getErrorMessage(err, t('errorFallback')));
    }
  }

  async function handleBulkDelete() {
    if (!hasSelection) {
      toast.error(t('list.selectFileError'));
      return;
    }

    try {
      await bulkDeleteAssets({ ids: Array.from(selectedIds) }).unwrap();
      toast.success(t('list.filesDeleted', { count: selectedIds.size }));
      setSelectedIds(new Set());
      setBulkMode(false);
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err, t('errorFallback')));
    }
  }

  function requestDelete(item: StorageAsset) {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  }

  async function confirmDelete() {
    if (!itemToDelete) return;

    try {
      await deleteAsset({ id: itemToDelete.id }).unwrap();
      toast.success(t('list.fileDeleted'));
      if (activeItem?.id === itemToDelete.id) setActiveItem(null);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err, t('errorFallback')));
    }
  }

  async function copyUrl() {
    if (!activeItem?.url) return;
    try {
      await navigator.clipboard.writeText(activeItem.url);
      toast.success('URL kopyalandı.');
    } catch {
      toast.error('URL kopyalanamadı.');
    }
  }

  async function createResizedAsset() {
    if (!activeItem) return;
    const width = Number(resizeWidth);
    if (!Number.isFinite(width) || width < 50) {
      toast.error('Geçerli bir genişlik girin.');
      return;
    }

    try {
      const file = await resizeImageAsset(activeItem, Math.trunc(width));
      await createAsset({
        file,
        bucket: activeItem.bucket || ADMIN_STORAGE_DEFAULT_BUCKET,
        folder: activeItem.folder || UPLOAD_FOLDER,
      }).unwrap();
      toast.success('Yeni boyut oluşturuldu.');
      setResizeWidth('');
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Görsel yeniden boyutlandırılamadı.'));
    }
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-normal">Medya Kütüphanesi</h1>
            <p className="text-sm text-muted-foreground">
              Toplam {total.toLocaleString('tr-TR')} dosya
              {items.length > 0 ? ` (${formatAdminStorageBytes(loadedSize)} gösterilen)` : ''}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => refetch()} disabled={busy}>
              <RefreshCcw className={cn('mr-2 size-4', isFetching && 'animate-spin')} />
              Yenile
            </Button>
            <Button variant={bulkMode ? 'default' : 'outline'} onClick={() => setBulkMode((value) => !value)} disabled={busy}>
              <CheckSquare className="mr-2 size-4" />
              Toplu İşlem
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-4 md:p-6">
            <div
              role="button"
              tabIndex={0}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click();
              }}
              onDragEnter={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragActive(false);
                if (event.dataTransfer.files.length) uploadFiles(event.dataTransfer.files);
              }}
              className={cn(
                'flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors',
                dragActive ? 'border-primary bg-primary/5' : 'border-border bg-muted/20 hover:bg-muted/30',
              )}
            >
              <UploadCloud className="mb-4 size-12 text-muted-foreground" />
              <p className="text-lg font-medium">Resim yüklemek için tıklayın</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Görseller storage içine yüklenir; grid üzerinden URL kopyalama, silme ve yeniden boyutlandırma yapılır.
              </p>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(event) => {
                  if (event.target.files?.length) uploadFiles(event.target.files);
                  event.currentTarget.value = '';
                }}
              />
            </div>
            {uploadProgress !== null ? (
              <div className="mt-4 space-y-2">
                <Progress value={uploadProgress} />
                <p className="text-center text-sm text-muted-foreground">Yükleniyor...</p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 rounded-lg border bg-card p-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('list.searchPlaceholder')}
              value={filters.search}
              onChange={(event) => updateFilters({ search: event.target.value })}
              className="pl-9"
            />
          </div>
          <Select value={filters.bucket} onValueChange={(bucket) => updateFilters({ bucket })}>
            <SelectTrigger className="lg:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ADMIN_STORAGE_ALL_OPTION}>{t('list.allOption')}</SelectItem>
              {buckets.map((bucket) => (
                <SelectItem key={bucket} value={bucket}>
                  {bucket}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.folder} onValueChange={(folder) => updateFilters({ folder })}>
            <SelectTrigger className="lg:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ADMIN_STORAGE_ALL_OPTION}>{t('list.allOption')}</SelectItem>
              {folders.map((folder) => (
                <SelectItem key={folder || 'root'} value={folder || ''}>
                  {folder || t('list.rootFolder')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.mime} onValueChange={(mime) => updateFilters({ mime })}>
            <SelectTrigger className="lg:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ADMIN_STORAGE_ALL_OPTION}>{t('list.allOption')}</SelectItem>
              {ADMIN_STORAGE_MIME_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {t(`list.${option.labelKey}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex min-h-[280px] items-center justify-center rounded-lg border bg-card">
            <Loader2 className="mr-2 size-5 animate-spin" />
            {t('list.loading')}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border bg-card p-12 text-center text-muted-foreground">{t('list.noFiles')}</div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
            {items.map((item) => {
              const Icon = getAdminStorageMimeIcon(item.mime);
              const selected = selectedIds.has(item.id);
              const isImage = item.url && item.mime.startsWith('image/');
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (bulkMode) toggleSelect(item.id);
                    else setActiveItem(item);
                  }}
                  className={cn(
                    'group relative overflow-hidden rounded-lg border bg-card text-left shadow-sm transition hover:border-primary/50 hover:shadow-md',
                    selected && 'border-primary ring-2 ring-primary/35',
                  )}
                >
                  {bulkMode ? (
                    <span className="absolute left-2 top-2 z-10 rounded bg-background/90 p-1 shadow">
                      {selected ? <CheckSquare className="size-5 text-primary" /> : <Square className="size-5" />}
                    </span>
                  ) : null}
                  <div className="aspect-square bg-muted">
                    {isImage ? (
                      <img src={item.url ?? ''} alt={item.name} className="size-full object-cover" />
                    ) : (
                      <div className="flex size-full items-center justify-center">
                        <Icon className="size-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 p-3">
                    <p className="truncate text-sm font-medium">{fileName(item)}</p>
                    <p className="text-xs text-muted-foreground">{dimensions(item)}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {totalPages > 1 ? (
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button variant="outline" disabled={filters.page <= 1 || busy} onClick={() => updateFilters({ page: filters.page - 1 })}>
              Önceki
            </Button>
            <Badge variant="outline" className="px-3 py-2">
              {filters.page} / {totalPages}
            </Badge>
            <Button variant="outline" disabled={filters.page >= totalPages || busy} onClick={() => updateFilters({ page: filters.page + 1 })}>
              Sonraki
            </Button>
          </div>
        ) : null}
      </div>

      {bulkMode ? (
        <div className="fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-lg border bg-background px-4 py-3 shadow-lg">
          <Button variant="outline" size="sm" onClick={toggleSelectAll} disabled={busy}>
            {selectedIds.size === items.length ? 'Seçimi kaldır' : 'Tümünü seç'}
          </Button>
          <Button variant="destructive" size="sm" onClick={handleBulkDelete} disabled={busy || !hasSelection}>
            Seçilenleri Sil ({selectedIds.size})
          </Button>
        </div>
      ) : null}

      <Dialog open={Boolean(activeItem)} onOpenChange={(open) => !open && setActiveItem(null)}>
        <DialogContent className="max-w-[900px] p-6">
          {activeItem ? (
            <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_300px]">
              <div className="flex min-h-[360px] items-center justify-center overflow-hidden rounded-lg bg-muted">
                {activeItem.url && activeItem.mime.startsWith('image/') ? (
                  <img src={activeItem.url} alt={activeItem.name} className="max-h-[520px] w-full object-contain" />
                ) : (
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    {React.createElement(getAdminStorageMimeIcon(activeItem.mime) || FileIcon, { className: 'size-16' })}
                    <span>{activeItem.mime}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-4">
                <DialogHeader>
                  <DialogTitle>Dosya Detayları</DialogTitle>
                  <DialogDescription className="sr-only">Seçili dosya bilgileri ve medya işlemleri.</DialogDescription>
                </DialogHeader>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Dosya Adı:</p>
                  <p className="break-all text-sm font-medium">{fileName(activeItem)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Boyutlar:</p>
                  <p className="text-sm font-medium">{dimensions(activeItem)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Dosya Boyutu:</p>
                  <p className="text-sm font-medium">{formatAdminStorageBytes(activeItem.size)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">URL:</p>
                  <div className="flex gap-2">
                    <Input readOnly value={activeItem.url ?? ''} onFocus={(event) => event.currentTarget.select()} />
                    <Button variant="outline" size="icon" onClick={copyUrl} disabled={!activeItem.url}>
                      <ClipboardCheck className="size-4" />
                    </Button>
                  </div>
                </div>

                {activeItem.mime.startsWith('image/') ? (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-semibold">Yeniden Boyutlandır</h4>
                    <p className="mt-1 text-xs text-muted-foreground">Genişlik girin, yükseklik otomatik hesaplanır.</p>
                    <div className="mt-3 flex gap-2">
                      <Input
                        type="number"
                        min={50}
                        placeholder="Örn: 800"
                        value={resizeWidth}
                        onChange={(event) => setResizeWidth(event.target.value)}
                      />
                      <Button onClick={createResizedAsset} disabled={busy || createAssetState.isLoading}>
                        Oluştur
                      </Button>
                    </div>
                  </div>
                ) : null}

                <DialogFooter className="mt-auto">
                  <Button variant="destructive" onClick={() => requestDelete(activeItem)} disabled={busy}>
                    <Trash2 className="mr-2 size-4" />
                    Sil
                  </Button>
                  <Button variant="outline" onClick={() => setActiveItem(null)}>
                    Kapat
                  </Button>
                </DialogFooter>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('list.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('list.deleteConfirmDescription', { name: itemToDelete ? fileName(itemToDelete) : t('list.defaultFileName') })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('list.cancelButton')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>{t('list.deleteButton')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
