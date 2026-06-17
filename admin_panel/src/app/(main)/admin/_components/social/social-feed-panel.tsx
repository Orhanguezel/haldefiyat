// =============================================================
// FILE: src/app/(main)/admin/_components/social/social-feed-panel.tsx
// Yayınlanan gönderiler — X (Twitter) görünümünde önizleme (read-only)
// Veri: ekosistem-sosyal-medya (ekosistem_sosyal cross-DB)
// =============================================================

"use client";

import * as React from "react";
import {
  Bookmark,
  Heart,
  MessageCircle,
  RefreshCw,
  Repeat2,
  Share,
  BarChart2,
} from "lucide-react";

import { useAdminT } from "@/app/(main)/admin/_components/common/use-admin-t";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSocialFeedQuery } from "@/integrations/hooks";
import {
  SOCIAL_ACCOUNTS,
  hasPublicSocialUrl,
  type SocialFeedPlatform,
  type SocialFeedPost,
} from "@/integrations/shared";

type Props = { platform: SocialFeedPlatform };

function compact(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}B`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}

function formatXDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const time = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(d);
  const date = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(d);
  return `${time} · ${date}`;
}

// Metni hashtag, mention ve link'lere göre renklendirir.
function RichText({ text }: { text: string }) {
  if (!text) return null;
  const parts = text.split(/(\s+)/);
  return (
    <>
      {parts.map((token, i) => {
        if (/^#[\p{L}\p{N}_]+$/u.test(token) || /^@[\w]+$/.test(token)) {
          return (
            <span key={i} className="text-sky-500">
              {token}
            </span>
          );
        }
        if (/^https?:\/\//.test(token) || /^[\w-]+\.(com|org|net|gov|tr)\b/.test(token)) {
          return (
            <span key={i} className="text-sky-500">
              {token}
            </span>
          );
        }
        return <React.Fragment key={i}>{token}</React.Fragment>;
      })}
    </>
  );
}

function Action({ icon: Icon, value }: { icon: typeof Heart; value?: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
      <Icon className="h-[1.1rem] w-[1.1rem]" />
      {typeof value === "number" && value > 0 ? compact(value) : null}
    </span>
  );
}

function TweetCard({ post, platform }: { post: SocialFeedPost; platform: SocialFeedPlatform }) {
  const acc = SOCIAL_ACCOUNTS[platform];
  const media = post.mediaUrls[0];
  const body = (
    <Card className="mx-auto w-full max-w-[600px] rounded-2xl">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={acc.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
          <div className="leading-tight">
            <p className="text-sm font-semibold">{acc.name}</p>
            <p className="text-xs text-muted-foreground">{acc.handle}</p>
          </div>
        </div>

        {post.text ? (
          <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
            <RichText text={post.text} />
          </p>
        ) : null}

        {post.hashtags ? (
          <p className="text-[15px] text-sky-500">
            <RichText text={post.hashtags} />
          </p>
        ) : null}

        {media ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={media} alt="" className="w-full rounded-2xl border object-cover" loading="lazy" />
        ) : null}

        <p className="text-xs text-muted-foreground">
          {formatXDate(post.postedAt)}
          {post.impressions > 0 ? ` · ${compact(post.impressions)} Görüntülenme` : ""}
        </p>

        <div className="flex items-center justify-between border-t pt-3">
          <Action icon={MessageCircle} value={post.comments} />
          <Action icon={Repeat2} value={post.shares} />
          <Action icon={Heart} value={post.likes} />
          <Action icon={BarChart2} value={post.impressions} />
          <Action icon={Bookmark} />
          <Action icon={Share} />
        </div>
      </CardContent>
    </Card>
  );

  if (hasPublicSocialUrl(post)) {
    return (
      <a href={post.url ?? "#"} target="_blank" rel="noopener noreferrer" className="block transition hover:opacity-95">
        {body}
      </a>
    );
  }
  return body;
}

export default function SocialFeedPanel({ platform }: Props) {
  const t = useAdminT("admin.social");
  const { data, isLoading, isFetching, refetch } = useSocialFeedQuery({ platform, limit: 30 });
  const items = data?.items ?? [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-base">{t("feed.title")}</CardTitle>
            <CardDescription>{t("header.description")}</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => void refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            {t("refresh")}
          </Button>
        </CardHeader>
      </Card>

      {isLoading ? (
        <div className="mx-auto w-full max-w-[600px] space-y-3">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card className="mx-auto w-full max-w-[600px]">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">{t("empty")}</CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((post) => (
            <TweetCard key={post.postId} post={post} platform={platform} />
          ))}
        </div>
      )}
    </div>
  );
}
