// =============================================================
// FILE: src/app/(main)/admin/(admin)/google-ads/_components/asset-section.tsx
// PMax öğe türü bölümü — metin/görsel/video ekle-listele-sil (descriptor bazlı)
// Görsel: ortak AdminImageUploadField (Yükle + Kütüphane) → seçilen URL Ads'e gider
// =============================================================

'use client';

import * as React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { useAdminT } from '@/app/(main)/admin/_components/common/use-admin-t';
import { AdminImageUploadField } from '@/components/common/admin-image-upload-field';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { resolveMediaUrl } from '@/lib/media-url';
import {
  useGoogleAdsAddTextMutation,
  useGoogleAdsAddVideoMutation,
  useGoogleAdsRemoveAssetMutation,
  useGoogleAdsUploadAssetUrlMutation,
} from '@/integrations/hooks';
import {
  ADS_FIELD_TYPE_LABELS,
  adsLabel,
  getErrorMessage,
  type GoogleAdsAssetItem,
  type GoogleAdsFieldDescriptor,
  type GoogleAdsImageFieldType,
  type GoogleAdsTextFieldType,
} from '@/integrations/shared';

type Props = {
  descriptor: GoogleAdsFieldDescriptor;
  assetGroupId: string;
  customerId?: string;
  items: GoogleAdsAssetItem[];
  onChanged: () => void;
};

export default function AssetSection({ descriptor, assetGroupId, customerId, items, onChanged }: Props) {
  const t = useAdminT('admin.googleAds');
  const [text, setText] = React.useState('');
  const [youtube, setYoutube] = React.useState('');

  const [addText, { isLoading: addingText }] = useGoogleAdsAddTextMutation();
  const [addVideo, { isLoading: addingVideo }] = useGoogleAdsAddVideoMutation();
  const [uploadUrl, { isLoading: uploading }] = useGoogleAdsUploadAssetUrlMutation();
  const [removeAsset, { isLoading: removing }] = useGoogleAdsRemoveAssetMutation();

  const full = items.length >= descriptor.max;
  const ok = items.length >= descriptor.target;
  const busy = addingText || addingVideo || uploading || removing;

  const run = async (fn: () => Promise<unknown>, okMsg: string, failMsg: string) => {
    try {
      await fn();
      toast.success(t(okMsg));
      setText('');
      setYoutube('');
      onChanged();
    } catch (err) {
      toast.error(`${t(failMsg)}: ${getErrorMessage(err)}`);
    }
  };

  const onRemove = (resourceName: string) =>
    window.confirm(t('assets.removeConfirm')) &&
    run(() => removeAsset({ resource_name: resourceName, customer_id: customerId }).unwrap(), 'assets.removed', 'assets.removeFailed');

  return (
    <div className="space-y-2 rounded-md border border-border p-3">
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm">{adsLabel(ADS_FIELD_TYPE_LABELS, descriptor.fieldType)}</span>
        <Badge variant={ok ? 'default' : 'secondary'}>
          {items.length}/{descriptor.target} {ok ? '✓' : '⚠'}
        </Badge>
      </div>

      {descriptor.kind === 'text' ? (
        <ul className="space-y-1">
          {items.map((it) => (
            <li key={it.resource_name} className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate">{it.text}</span>
              <button type="button" onClick={() => onRemove(it.resource_name)} disabled={removing} aria-label={t('assets.remove')}>
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-red-500" />
              </button>
            </li>
          ))}
        </ul>
      ) : descriptor.kind === 'image' ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {items.map((it) => (
            <div key={it.resource_name} className="group relative overflow-hidden rounded border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.image_url} alt={it.name} className="aspect-square w-full bg-white object-contain" />
              <button
                type="button"
                onClick={() => onRemove(it.resource_name)}
                disabled={removing}
                className="absolute top-1 right-1 rounded bg-black/60 p-1 text-white/90 hover:text-red-400"
                aria-label={t('assets.remove')}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <ul className="space-y-1">
          {items.map((it) => (
            <li key={it.resource_name} className="flex items-center justify-between gap-2 text-sm">
              <a href={`https://youtu.be/${it.video_id}`} target="_blank" rel="noreferrer" className="truncate text-primary underline">
                {it.video_id}
              </a>
              <button type="button" onClick={() => onRemove(it.resource_name)} disabled={removing} aria-label={t('assets.remove')}>
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-red-500" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {full ? (
        <p className="text-muted-foreground text-xs">{t('assets.maxReached')}</p>
      ) : descriptor.kind === 'text' ? (
        <div className="flex items-center gap-2">
          <Input
            value={text}
            maxLength={descriptor.maxLen}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('assets.textPlaceholder')}
            className="h-8 text-sm"
          />
          <span className="text-muted-foreground text-xs tabular-nums">{text.length}/{descriptor.maxLen}</span>
          <Button
            size="sm"
            disabled={busy || !text.trim()}
            onClick={() =>
              run(
                () => addText({ assetGroupId, fieldType: descriptor.fieldType as GoogleAdsTextFieldType, text: text.trim(), customer_id: customerId }).unwrap(),
                'assets.added',
                'assets.addFailed',
              )
            }
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      ) : descriptor.kind === 'image' ? (
        <AdminImageUploadField
          label={t('assets.addImage')}
          helperText={t('assets.cropNote')}
          folder="google-ads"
          value=""
          disabled={busy}
          previewAspect="1x1"
          onChange={(url) =>
            run(
              () =>
                uploadUrl({
                  assetGroupId,
                  fieldType: descriptor.fieldType as GoogleAdsImageFieldType,
                  url: resolveMediaUrl(url),
                  customer_id: customerId,
                }).unwrap(),
              'assets.uploaded',
              'assets.uploadFailed',
            )
          }
        />
      ) : (
        <div className="flex items-center gap-2">
          <Input
            value={youtube}
            onChange={(e) => setYoutube(e.target.value)}
            placeholder={t('assets.youtubePlaceholder')}
            className="h-8 text-sm"
          />
          <Button
            size="sm"
            disabled={busy || !youtube.trim()}
            onClick={() => run(() => addVideo({ assetGroupId, youtube: youtube.trim(), customer_id: customerId }).unwrap(), 'assets.added', 'assets.addFailed')}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
