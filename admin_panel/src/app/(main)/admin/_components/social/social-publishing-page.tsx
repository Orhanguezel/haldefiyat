// =============================================================
// FILE: src/app/(main)/admin/_components/social/social-publishing-page.tsx
// Platform başına sosyal yönetim sayfası — ekosistem-sosyal-medya motoru
// =============================================================

"use client";

import SocialComposePanel from "@/app/(main)/admin/_components/social/social-compose-panel";
import SocialFeedPanel from "@/app/(main)/admin/_components/social/social-feed-panel";
import SocialPlanPanel from "@/app/(main)/admin/_components/social/social-plan-panel";
import SocialQueuePanel from "@/app/(main)/admin/_components/social/social-queue-panel";
import SocialTemplatesPanel from "@/app/(main)/admin/_components/social/social-templates-panel";
import { useAdminT } from "@/app/(main)/admin/_components/common/use-admin-t";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSocialStatusQuery } from "@/integrations/hooks";
import type { SocialFeedPlatform } from "@/integrations/shared";

type Props = { platform: SocialFeedPlatform };

export default function SocialPublishingPage({ platform }: Props) {
  const t = useAdminT("admin.social");
  const { data: status } = useSocialStatusQuery({ platform });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-2">
          <CardTitle className="text-base">{t(`platforms.${platform}` as "platforms.twitter")}</CardTitle>
          <CardDescription>{t("header.description")}</CardDescription>
          <div className="flex flex-wrap gap-2">
            <Badge variant={status?.has_credentials ? "default" : "destructive"}>
              {status?.has_credentials ? t("header.credentialsOk") : t("header.credentialsMissing")}
            </Badge>
            <Badge variant={status?.enabled ? "default" : "secondary"}>
              {status?.enabled ? t("header.statusEnabled") : t("header.statusDisabled")}
            </Badge>
            {status?.account?.name ? <Badge variant="outline">{status.account.name}</Badge> : null}
          </div>
          {status?.account?.lastError ? (
            <p className="text-xs text-destructive">
              {t("header.accountError")}: {status.account.lastError}
            </p>
          ) : null}
        </CardHeader>
      </Card>

      <Tabs defaultValue="plan" className="w-full">
        <TabsList>
          <TabsTrigger value="plan">{t("tabs.plan")}</TabsTrigger>
          <TabsTrigger value="templates">{t("tabs.templates")}</TabsTrigger>
          <TabsTrigger value="compose">{t("tabs.compose")}</TabsTrigger>
          <TabsTrigger value="queue">{t("tabs.queue")}</TabsTrigger>
          <TabsTrigger value="published">{t("tabs.published")}</TabsTrigger>
        </TabsList>

        <TabsContent value="plan" className="space-y-4">
          <SocialPlanPanel platform={platform} />
        </TabsContent>
        <TabsContent value="templates" className="space-y-4">
          <SocialTemplatesPanel platform={platform} />
        </TabsContent>
        <TabsContent value="compose" className="space-y-4">
          <SocialComposePanel platform={platform} />
        </TabsContent>
        <TabsContent value="queue" className="space-y-4">
          <SocialQueuePanel platform={platform} />
        </TabsContent>
        <TabsContent value="published" className="space-y-4">
          <SocialFeedPanel platform={platform} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
