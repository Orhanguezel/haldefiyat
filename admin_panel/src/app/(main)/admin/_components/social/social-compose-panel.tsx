// =============================================================
// FILE: src/app/(main)/admin/_components/social/social-compose-panel.tsx
// Manuel Gönderi — AI taslak + anında yayınla / ileri tarihli planla (@haldefiyat)
// =============================================================

"use client";

import * as React from "react";
import { Send, Save, Sparkles, CalendarClock, BarChart3 } from "lucide-react";
import { toast } from "sonner";

import AdminImageUploadField from "@/app/(main)/admin/_components/common/admin-image-upload-field";
import { useAdminT } from "@/app/(main)/admin/_components/common/use-admin-t";
import { useAIContentAssist } from "@/app/(main)/admin/_components/common/use-ai-content-assist";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLazySocialChartPreviewQuery, useSocialSavePostMutation, useSocialSendMutation } from "@/integrations/hooks";
import { getErrorMessage, type SocialComposeBody, type SocialFeedPlatform } from "@/integrations/shared";

export default function SocialComposePanel({ platform }: { platform: SocialFeedPlatform }) {
  const t = useAdminT("admin.social");
  const [caption, setCaption] = React.useState("");
  const [hashtags, setHashtags] = React.useState("");
  const [media, setMedia] = React.useState("");
  const [topic, setTopic] = React.useState("");
  const [scheduledAt, setScheduledAt] = React.useState("");
  const [send, { isLoading: sending }] = useSocialSendMutation();
  const [saveDraft, { isLoading: saving }] = useSocialSavePostMutation();
  const [fetchChart, { isFetching: chartLoading }] = useLazySocialChartPreviewQuery();
  const { assist, loading: aiLoading } = useAIContentAssist();

  const busy = sending || saving || aiLoading || chartLoading;

  const handleAddChart = async () => {
    try {
      const res = await fetchChart({ platform }).unwrap();
      if (res.url) {
        setMedia(res.url);
        toast.success(t("compose.chartAdded"));
      } else {
        toast.error(t("compose.chartFailed"));
      }
    } catch {
      toast.error(t("compose.chartFailed"));
    }
  };

  const buildBody = (): SocialComposeBody => ({
    platform,
    caption: caption.trim(),
    hashtags: hashtags.trim() || undefined,
    mediaUrls: media.trim() ? [media.trim()] : undefined,
    scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
  });

  const reset = () => {
    setCaption("");
    setHashtags("");
    setMedia("");
    setTopic("");
    setScheduledAt("");
  };

  const handleAi = async () => {
    const seed = topic.trim() || caption.trim();
    if (!seed) return toast.error(t("compose.aiTopicRequired"));
    const result = await assist({ title: seed, locale: "tr", action: "full", module_key: "social-tweet" });
    const first = result?.[0];
    if (!first) return;
    setCaption((first.summary || first.content || "").trim().slice(0, 280));
    if (first.tags) setHashtags(first.tags);
  };

  const handlePublish = async () => {
    if (!caption.trim()) return toast.error(t("compose.emptyCaption"));
    if (!confirm(t("compose.publishConfirm"))) return;
    try {
      await send(buildBody()).unwrap();
      toast.success(t("compose.published"));
      reset();
    } catch (err) {
      toast.error(`${t("compose.publishFailed")}: ${getErrorMessage(err)}`);
    }
  };

  const handleSaveDraft = async () => {
    if (!caption.trim()) return toast.error(t("compose.emptyCaption"));
    try {
      await saveDraft(buildBody()).unwrap();
      toast.success(scheduledAt ? t("compose.scheduled") : t("compose.saved"));
      reset();
    } catch (err) {
      toast.error(`${t("compose.saveFailed")}: ${getErrorMessage(err)}`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("compose.title")}</CardTitle>
        <CardDescription>{t("compose.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* AI taslak */}
        <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
          <Label htmlFor="social-topic" className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4" /> {t("compose.aiTitle")}
          </Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id="social-topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={t("compose.aiTopicPlaceholder")}
            />
            <Button type="button" variant="secondary" onClick={handleAi} disabled={busy}>
              <Sparkles className="mr-2 h-4 w-4" />
              {aiLoading ? t("compose.aiGenerating") : t("compose.aiGenerate")}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="social-caption">{t("compose.caption")}</Label>
          <Textarea
            id="social-caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder={t("compose.captionPlaceholder")}
            rows={5}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="social-hashtags">{t("compose.hashtags")}</Label>
          <Input
            id="social-hashtags"
            value={hashtags}
            onChange={(e) => setHashtags(e.target.value)}
            placeholder={t("compose.hashtagsPlaceholder")}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t("compose.media")}</span>
            <Button type="button" variant="ghost" size="sm" onClick={handleAddChart} disabled={busy}>
              <BarChart3 className="mr-2 h-4 w-4" />
              {chartLoading ? t("compose.chartLoading") : t("compose.addChart")}
            </Button>
          </div>
          <AdminImageUploadField
            helperText={t("compose.mediaHelper")}
            folder="social"
            value={media}
            onChange={setMedia}
            previewAspect="16x9"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="social-schedule" className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4" /> {t("compose.schedule")}
          </Label>
          <Input
            id="social-schedule"
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">{t("compose.scheduleHelper")}</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={handleSaveDraft} disabled={busy}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? t("compose.saving") : scheduledAt ? t("compose.scheduleBtn") : t("compose.saveDraft")}
          </Button>
          <Button onClick={handlePublish} disabled={busy}>
            <Send className="mr-2 h-4 w-4" />
            {sending ? t("compose.publishing") : t("compose.publish")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
