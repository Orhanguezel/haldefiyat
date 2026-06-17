"use client";

import { useAdminT } from "@/app/(main)/admin/_components/common/use-admin-t";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTwitterTemplatePreviewsQuery } from "@/integrations/hooks";
import type { SocialPlatform } from "@/integrations/shared";

import { TwitterTweetCard } from "./twitter-tweet-card";

type TwitterTemplatePanelProps = {
  platform: SocialPlatform;
};

export default function TwitterTemplatePanel({ platform }: TwitterTemplatePanelProps) {
  const t = useAdminT("admin.twitter");
  const { data, isLoading } = useTwitterTemplatePreviewsQuery({ platform });
  const items = data?.items ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(`templates.title.${platform}` as "templates.title.twitter")}</CardTitle>
        <CardDescription>{t(`templates.description.${platform}` as "templates.description.twitter")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : items.length === 0 ? (
          <p className="py-6 text-muted-foreground text-sm">{t("templates.empty")}</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {items.map((item) => (
              <div key={item.id} className="space-y-2">
                <div>
                  <h3 className="font-medium text-sm">{item.title}</h3>
                  <p className="text-muted-foreground text-xs">{item.description}</p>
                </div>
                <TwitterTweetCard item={{ ...item, platform }} mode="preview" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
