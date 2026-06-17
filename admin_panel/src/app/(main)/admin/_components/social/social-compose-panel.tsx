// =============================================================
// FILE: src/app/(main)/admin/_components/social/social-compose-panel.tsx
// Manuel Gönderi — ekosistem üzerinden oluştur/yayınla (@haldefiyat)
// =============================================================

"use client";

import * as React from "react";
import { Send, Save } from "lucide-react";
import { toast } from "sonner";

import AdminImageUploadField from "@/app/(main)/admin/_components/common/admin-image-upload-field";
import { useAdminT } from "@/app/(main)/admin/_components/common/use-admin-t";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSocialSavePostMutation, useSocialSendMutation } from "@/integrations/hooks";
import { getErrorMessage, type SocialComposeBody, type SocialFeedPlatform } from "@/integrations/shared";

export default function SocialComposePanel({ platform }: { platform: SocialFeedPlatform }) {
  const t = useAdminT("admin.social");
  const [caption, setCaption] = React.useState("");
  const [hashtags, setHashtags] = React.useState("");
  const [media, setMedia] = React.useState("");
  const [send, { isLoading: sending }] = useSocialSendMutation();
  const [saveDraft, { isLoading: saving }] = useSocialSavePostMutation();

  const busy = sending || saving;

  const buildBody = (): SocialComposeBody => ({
    platform,
    caption: caption.trim(),
    hashtags: hashtags.trim() || undefined,
    mediaUrls: media.trim() ? [media.trim()] : undefined,
  });

  const reset = () => {
    setCaption("");
    setHashtags("");
    setMedia("");
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
      toast.success(t("compose.saved"));
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

        <AdminImageUploadField
          label={t("compose.media")}
          helperText={t("compose.mediaHelper")}
          folder="social"
          value={media}
          onChange={setMedia}
          previewAspect="16x9"
        />

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={handleSaveDraft} disabled={busy}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? t("compose.saving") : t("compose.saveDraft")}
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
