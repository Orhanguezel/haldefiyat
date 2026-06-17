// =============================================================
// FILE: src/app/(main)/admin/_components/social/social-feed-panel.tsx
// Platform başına sosyal izleme paneli (ekosistem-sosyal-medya, read-only)
// =============================================================

"use client";

import * as React from "react";
import { ExternalLink, Heart, MessageCircle, RefreshCw, Repeat2, Eye } from "lucide-react";

import { useAdminT } from "@/app/(main)/admin/_components/common/use-admin-t";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSocialFeedQuery } from "@/integrations/hooks";
import { hasPublicSocialUrl, type SocialFeedPlatform, type SocialFeedPost } from "@/integrations/shared";

type Props = { platform: SocialFeedPlatform };

function formatDate(iso: string, locale: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

function Metric({ icon: Icon, value, label }: { icon: typeof Heart; value: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground" title={label}>
      <Icon className="h-3.5 w-3.5" />
      {value.toLocaleString("tr-TR")}
    </span>
  );
}

function PostCard({ post, t, locale }: { post: SocialFeedPost; t: ReturnType<typeof useAdminT>; locale: string }) {
  const media = post.mediaUrls[0];
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex gap-4 p-4">
        {media ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={media} alt="" className="h-24 w-24 shrink-0 rounded-md object-cover" loading="lazy" />
        ) : null}
        <div className="min-w-0 flex-1 space-y-2">
          <p className="whitespace-pre-wrap break-words text-sm">{post.text || "—"}</p>
          {post.hashtags ? <p className="text-xs text-primary">{post.hashtags}</p> : null}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <span className="text-xs text-muted-foreground">{formatDate(post.postedAt, locale)}</span>
            <Metric icon={Heart} value={post.likes} label={t("metrics.likes")} />
            <Metric icon={MessageCircle} value={post.comments} label={t("metrics.comments")} />
            <Metric icon={Repeat2} value={post.shares} label={t("metrics.shares")} />
            <Metric icon={Eye} value={post.impressions} label={t("metrics.impressions")} />
          </div>
        </div>
        {hasPublicSocialUrl(post) ? (
          <Button asChild variant="ghost" size="icon" className="shrink-0">
            <a href={post.url ?? "#"} target="_blank" rel="noopener noreferrer" title={t("openPost")}>
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default function SocialFeedPanel({ platform }: Props) {
  const t = useAdminT("admin.social");
  const locale = "tr";
  const { data, isLoading, isFetching, refetch } = useSocialFeedQuery({ platform, limit: 30 });
  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-base">{t(`platforms.${platform}` as "platforms.twitter")}</CardTitle>
            <CardDescription>{t("header.description")}</CardDescription>
            <div className="flex gap-2 pt-1">
              <Badge variant="secondary">{t("header.source")}</Badge>
              <Badge variant="outline">{t("header.count", { count: String(data?.count ?? 0) })}</Badge>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => void refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            {t("refresh")}
          </Button>
        </CardHeader>
      </Card>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">{t("empty")}</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((post) => (
            <PostCard key={post.postId} post={post} t={t} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
