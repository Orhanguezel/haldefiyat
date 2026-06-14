// =============================================================
// FILE: src/app/(main)/admin/(admin)/twitter/_components/twitter-send-panel.tsx
// Manual tweet send panel
// =============================================================

'use client';

import * as React from 'react';
import { AdminImageUploadField } from '@/app/(main)/admin/_components/common/admin-image-upload-field';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send, Sparkles, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { useAdminT } from '@/app/(main)/admin/_components/common/use-admin-t';
import { useListHfProductsAdminQuery, useTwitterAiDraftMutation, useTwitterSendMutation } from '@/integrations/hooks';
import {
  PLATFORM_SEND_CONFIG,
  buildTweetUrl,
  getErrorMessage,
  type PostFormat,
  type SocialPlatform,
} from '@/integrations/shared';
import { TwitterTweetCard } from './twitter-tweet-card';

const AUTO_PRODUCT = '__auto__';

const AI_TEMPLATE_OPTIONS = [
  'local_seed_value',
  'variety_promo',
  'agronomy_tip',
  'interaction_question',
  'interaction_poll',
  'field_proof',
  'human_research',
  'seed_myth',
  'export_vision',
] as const;

function joinTweet(body: string, hashtags: string) {
  return [body.trim(), hashtags.trim()].filter(Boolean).join('\n\n');
}

type TwitterSendPanelProps = {
  platform: SocialPlatform;
};

export default function TwitterSendPanel({ platform }: TwitterSendPanelProps) {
  const t = useAdminT('admin.twitter');
  const [twitterSend, { isLoading: sending }] = useTwitterSendMutation();
  const [twitterAiDraft, { isLoading: aiLoading }] = useTwitterAiDraftMutation();
  const { data: productsResponse } = useListHfProductsAdminQuery({
    isActive: true,
  });
  const products = productsResponse?.items ?? [];
  const cfg = PLATFORM_SEND_CONFIG[platform];
  const [text, setText] = React.useState('');
  const [hashtags, setHashtags] = React.useState(cfg.defaultTags);
  const [mediaUrl, setMediaUrl] = React.useState<string | null>(null);
  const [postFormat, setPostFormat] = React.useState<PostFormat>('post');

  // Platform değişince o platformun karakterine sıfırla
  React.useEffect(() => {
    setHashtags(PLATFORM_SEND_CONFIG[platform].defaultTags);
    setPostFormat('post');
  }, [platform]);
  const [aiTemplate, setAiTemplate] = React.useState<(typeof AI_TEMPLATE_OPTIONS)[number]>('local_seed_value');
  const [aiProductId, setAiProductId] = React.useState(AUTO_PRODUCT);
  const [aiTopic, setAiTopic] = React.useState('');

  const isStory = postFormat === 'story';
  const trimmed = isStory ? text.trim() : joinTweet(text, hashtags);
  const overLimit = trimmed.length > cfg.maxLength;
  const mediaMissing = cfg.mediaRequired && !mediaUrl;
  const canSend = (isStory ? Boolean(mediaUrl) : trimmed.length > 0) && !overLimit && !mediaMissing && !sending;

  const handleSend = async () => {
    if (!canSend) return;
    if (!window.confirm(t('send.confirm'))) return;

    try {
      const res = await twitterSend({
        text: isStory ? (trimmed || t('send.storyDefaultText')) : trimmed,
        platform,
        media_url: mediaUrl,
        post_format: postFormat,
      }).unwrap();
      const ref = platform === 'twitter' ? buildTweetUrl(res.tweet_id) : res.tweet_id;
      toast.success(`${t('send.sent')} — ${ref}`);
      setText('');
      setMediaUrl(null);
    } catch (err) {
      toast.error(`${t('send.failed')}: ${getErrorMessage(err)}`);
    }
  };

  const handleAiDraft = async () => {
    try {
      const res = await twitterAiDraft({
        platform,
        template: aiTemplate,
        product_id: aiProductId === AUTO_PRODUCT ? null : aiProductId,
        topic: aiTopic,
        current_text: trimmed,
      }).unwrap();
      setText(res.caption);
      setHashtags(res.hashtags);
      if (res.media_url && !mediaUrl) setMediaUrl(res.media_url);
      toast.success(res.source === 'ai' ? t('send.ai.generated') : t('send.ai.fallbackGenerated'));
    } catch (err) {
      toast.error(`${t('send.ai.failed')}: ${getErrorMessage(err)}`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(`send.title.${platform}` as 'send.title.twitter')}</CardTitle>
        <CardDescription>{t('send.description')}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-3 rounded-md border bg-muted/20 p-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="h-4 w-4 text-primary" />
                {t(`send.ai.title.${platform}` as 'send.ai.title.twitter')}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {t('send.ai.description', { platform: t(`platforms.${platform}` as 'platforms.twitter') })}
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={handleAiDraft} disabled={aiLoading || sending}>
              {aiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              {aiLoading ? t('send.ai.generating') : t('send.ai.generate')}
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{t('send.ai.templateLabel')}</Label>
              <Select
                value={aiTemplate}
                onValueChange={(value) => setAiTemplate(value as (typeof AI_TEMPLATE_OPTIONS)[number])}
                disabled={aiLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AI_TEMPLATE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {t(`send.ai.templates.${option}` as 'send.ai.templates.local_seed_value')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('send.ai.productLabel')}</Label>
              <Select value={aiProductId} onValueChange={setAiProductId} disabled={aiLoading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={AUTO_PRODUCT}>{t('send.ai.autoProduct')}</SelectItem>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={String(product.id)}>
                      {product.nameTr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('send.ai.topicLabel')}</Label>
            <Textarea
              rows={3}
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              placeholder={t('send.ai.topicPlaceholder')}
              disabled={aiLoading}
            />
          </div>
        </div>

        {cfg.supportsStory ? (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
            <div className="space-y-1">
              <Label className="font-medium">{t('send.storyToggle')}</Label>
              <p className="text-muted-foreground text-xs">{t('send.storyToggleDesc')}</p>
            </div>
            <Switch checked={isStory} onCheckedChange={(v: boolean) => setPostFormat(v ? 'story' : 'post')} />
          </div>
        ) : null}

        <div className="space-y-2">
          <Label>{t(`send.bodyLabel.${platform}` as 'send.bodyLabel.twitter')}</Label>
          <Textarea
            rows={6}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('send.placeholder')}
          />
        </div>

        <div className="space-y-2">
          <Label>{t('send.hashtagsLabel')}</Label>
          <Textarea
            rows={2}
            value={hashtags}
            onChange={(e) => setHashtags(e.target.value)}
            placeholder="#VistaSeeds #yerlitohum"
          />
        </div>

        <div className="space-y-2">
          <AdminImageUploadField
            label={t('send.mediaLabel')}
            helperText={t('send.mediaHelper')}
            value={mediaUrl || ''}
            onChange={(url) => setMediaUrl(url || null)}
            disabled={sending}
            folder="twitter/haldefiyat"
            previewAspect="16x9"
            previewObjectFit="contain"
          />
          {mediaUrl ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setMediaUrl(null)}
              disabled={sending}
            >
              <Trash2 className="h-4 w-4" />
              {t('send.clearMedia')}
            </Button>
          ) : null}
        </div>

        {trimmed ? (
          <TwitterTweetCard
            mode="preview"
            item={{
              id: 'manual-preview',
              title: t('send.previewTitle'),
              template: 'manual',
              slot_label: t('send.previewTime'),
              content: trimmed,
              media_url: mediaUrl,
            }}
          />
        ) : null}

        <div className="flex items-center justify-between gap-3">
          <span
            className={`text-xs ${overLimit || mediaMissing ? 'text-destructive' : 'text-muted-foreground'}`}
          >
            {trimmed.length} / {cfg.maxLength}
            {mediaMissing ? ` — ${t('send.mediaRequired')}` : ''}
          </span>

          <Button onClick={handleSend} disabled={!canSend} className="gap-2">
            <Send className="h-4 w-4" />
            {sending ? t('send.sending') : t('send.submit')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
