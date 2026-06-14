// =============================================================
// FILE: src/app/(main)/admin/(admin)/twitter/twitter.tsx
// Admin Twitter/X Page (Settings + Send + Log)
// =============================================================

"use client";

import * as React from "react";
import { Settings, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { useAdminT } from "@/app/(main)/admin/_components/common/use-admin-t";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTwitterStatusQuery, useTwitterVerifyMutation } from "@/integrations/hooks";
import { getErrorMessage, SOCIAL_PLATFORMS, type SocialPlatform } from "@/integrations/shared";

import TwitterLogPanel from "./_components/twitter-log-panel";
import TwitterPlanPanel from "./_components/twitter-plan-panel";
import TwitterSendPanel from "./_components/twitter-send-panel";
import TwitterTemplatePanel from "./_components/twitter-template-panel";

export default function TwitterAdminPage() {
  const t = useAdminT("admin.twitter");
  const [platform, setPlatform] = React.useState<SocialPlatform>("twitter");
  const { data: status, refetch: refetchStatus } = useTwitterStatusQuery({ platform });
  const [twitterVerify, { isLoading: verifying }] = useTwitterVerifyMutation();

  const handleVerify = async () => {
    try {
      const res = await twitterVerify({ platform }).unwrap();
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div className="space-y-2">
            <CardTitle className="text-base">{t("header.title")}</CardTitle>
            <CardDescription>{t("header.description")}</CardDescription>
            <div className="flex gap-2">
              <Badge variant={status?.enabled ? "default" : "secondary"}>
                {status?.enabled ? t("header.statusEnabled") : t("header.statusDisabled")}
              </Badge>
              <Badge variant={status?.has_credentials ? "default" : "destructive"}>
                {status?.has_credentials ? t("header.credentialsOk") : t("header.credentialsMissing")}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {SOCIAL_PLATFORMS.map((item) => (
                <Button
                  key={item}
                  type="button"
                  variant={platform === item ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPlatform(item)}
                >
                  {t(`platforms.${item}` as "platforms.twitter")}
                </Button>
              ))}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleVerify}
            disabled={verifying || !status?.has_credentials}
          >
            <ShieldCheck className="mr-2 h-4 w-4" />
            {verifying ? t("header.verifying") : t("header.verify")}
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href="/admin/site-settings?tab=api">
              <Settings className="mr-2 h-4 w-4" />
              {t("header.apiSettings")}
            </a>
          </Button>
        </CardHeader>
      </Card>

      <Tabs defaultValue="plan" className="w-full">
        <TabsList>
          <TabsTrigger value="plan">{t("tabs.plan")}</TabsTrigger>
          <TabsTrigger value="templates">{t("tabs.templates")}</TabsTrigger>
          <TabsTrigger value="send">{platform === "twitter" ? t("tabs.send") : t("tabs.sendGeneric")}</TabsTrigger>
          <TabsTrigger value="queue">{t("tabs.queue")}</TabsTrigger>
          <TabsTrigger value="history">{t("tabs.history")}</TabsTrigger>
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

        <TabsContent value="queue" className="space-y-4">
          <TwitterLogPanel scope="queue" platform={platform} />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <TwitterLogPanel scope="history" platform={platform} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
