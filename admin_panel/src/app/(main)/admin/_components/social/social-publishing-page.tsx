// =============================================================
// FILE: src/app/(main)/admin/_components/social/social-publishing-page.tsx
// Platform başına sosyal yönetim sayfası (plan + manuel gönderi + kuyruk + yayınlananlar)
// =============================================================

"use client";

import * as React from "react";
import { Settings, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { useAdminT } from "@/app/(main)/admin/_components/common/use-admin-t";
import TwitterLogPanel from "@/app/(main)/admin/(admin)/twitter/_components/twitter-log-panel";
import TwitterPlanPanel from "@/app/(main)/admin/(admin)/twitter/_components/twitter-plan-panel";
import TwitterSendPanel from "@/app/(main)/admin/(admin)/twitter/_components/twitter-send-panel";
import TwitterTemplatePanel from "@/app/(main)/admin/(admin)/twitter/_components/twitter-template-panel";
import SocialFeedPanel from "@/app/(main)/admin/_components/social/social-feed-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTwitterStatusQuery, useTwitterVerifyMutation } from "@/integrations/hooks";
import { getErrorMessage, type SocialFeedPlatform } from "@/integrations/shared";

type Props = { platform: SocialFeedPlatform };

export default function SocialPublishingPage({ platform }: Props) {
  const t = useAdminT("admin.twitter");
  const { data: status, refetch: refetchStatus } = useTwitterStatusQuery({ platform });
  const [verify, { isLoading: verifying }] = useTwitterVerifyMutation();

  const handleVerify = async () => {
    try {
      const res = await verify({ platform }).unwrap();
      if (res.ok && res.account) {
        const label = res.account.username || res.account.name;
        toast.success(`${t("header.verified")}: ${platform === "twitter" ? "@" : ""}${label}`);
      } else {
        toast.error(t("header.verifyFailed"));
      }
    } catch (err) {
      toast.error(`${t("header.verifyFailed")}: ${getErrorMessage(err)}`);
    } finally {
      void refetchStatus();
    }
  };

  const platformLabel = t(`platforms.${platform}` as "platforms.twitter");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div className="space-y-2">
            <CardTitle className="text-base">{platformLabel}</CardTitle>
            <CardDescription>{t("header.description")}</CardDescription>
            <div className="flex gap-2">
              <Badge variant={status?.enabled ? "default" : "secondary"}>
                {status?.enabled ? t("header.statusEnabled") : t("header.statusDisabled")}
              </Badge>
              <Badge variant={status?.has_credentials ? "default" : "destructive"}>
                {status?.has_credentials ? t("header.credentialsOk") : t("header.credentialsMissing")}
              </Badge>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" size="sm" onClick={handleVerify} disabled={verifying || !status?.has_credentials}>
              <ShieldCheck className="mr-2 h-4 w-4" />
              {verifying ? t("header.verifying") : t("header.verify")}
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href="/admin/site-settings?tab=api">
                <Settings className="mr-2 h-4 w-4" />
                {t("header.apiSettings")}
              </a>
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="plan" className="w-full">
        <TabsList>
          <TabsTrigger value="plan">{t("tabs.plan")}</TabsTrigger>
          <TabsTrigger value="templates">{t("tabs.templates")}</TabsTrigger>
          <TabsTrigger value="send">{platform === "twitter" ? t("tabs.send") : t("tabs.sendGeneric")}</TabsTrigger>
          <TabsTrigger value="drafts">{t("tabs.drafts")}</TabsTrigger>
          <TabsTrigger value="published">{t("tabs.published")}</TabsTrigger>
        </TabsList>

        <TabsContent value="plan" className="space-y-4">
          <TwitterPlanPanel platform={platform} />
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <TwitterTemplatePanel platform={platform} />
        </TabsContent>

        <TabsContent value="send" className="space-y-4">
          <TwitterSendPanel platform={platform} />
        </TabsContent>

        <TabsContent value="drafts" className="space-y-4">
          <TwitterLogPanel scope="queue" platform={platform} />
        </TabsContent>

        <TabsContent value="published" className="space-y-4">
          <SocialFeedPanel platform={platform} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
