"use client";

import { ExternalLink, XCircle } from "lucide-react";

import { useAdminT } from "@/app/(main)/admin/_components/common/use-admin-t";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buildTweetUrl, type SocialPlatform, type TweetLogRow, type TweetStatus } from "@/integrations/shared";

const STATUS_VARIANTS: Record<TweetStatus, "default" | "secondary" | "destructive" | "outline"> = {
  sent: "default",
  queued: "secondary",
  posting: "secondary",
  failed: "destructive",
  canceled: "outline",
};

type PreviewLike = {
  id: string;
  platform?: SocialPlatform;
  content: string;
  template?: string | null;
  title?: string;
  slot_label?: string | null;
  media_url?: string | null;
};

type TwitterTweetCardProps = {
  item: TweetLogRow | PreviewLike;
  mode?: "preview" | "log";
  onCancel?: (id: string) => void;
  canceling?: boolean;
};

function isLogRow(item: TweetLogRow | PreviewLike): item is TweetLogRow {
  return "status" in item;
}

function splitTweet(text: string) {
  const lines = text.split("\n");
  const last = lines.at(-1)?.trim() || "";
  const hashtags = last.startsWith("#") ? lines.pop() || "" : "";
  return { body: lines.join("\n").trim(), hashtags };
}

export function TwitterTweetCard({ item, mode = "log", onCancel, canceling }: TwitterTweetCardProps) {
  const t = useAdminT("admin.twitter");
  const parsed = splitTweet(item.content);
  const isLog = isLogRow(item);
  const logRow: TweetLogRow | null = isLog ? item : null;
  const preview: PreviewLike | null = isLog ? null : item;
  const template = item.template || (logRow?.source ?? null);
  const platform = item.platform || logRow?.platform || "twitter";
  const displayTime = logRow
    ? logRow.status === "queued" && logRow.scheduled_at
      ? `${t("log.scheduledFor")}: ${new Date(logRow.scheduled_at).toLocaleString()}`
      : new Date(logRow.posted_at || logRow.created_at).toLocaleString()
    : preview?.slot_label || t("templates.sampleTime");

  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-700 font-semibold text-sm text-white">
          VS
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="min-w-0">
              <span className="font-medium">Vista Seeds</span>
              <span className="ml-1 text-muted-foreground text-xs">
                {platform === "twitter" ? "@VistaSeeds" : t(`platforms.${platform}` as "platforms.twitter")} · {displayTime}
              </span>
            </div>
            {logRow ? (
              <Badge variant={STATUS_VARIANTS[logRow.status] ?? "outline"}>{t(`log.status.${logRow.status}`)}</Badge>
            ) : (
              <Badge variant="outline">{t("templates.previewBadge")}</Badge>
            )}
            <Badge variant="secondary">{t(`platforms.${platform}` as "platforms.twitter")}</Badge>
            {template ? <Badge variant="outline">{template}</Badge> : null}
          </div>

          <p className="whitespace-pre-wrap break-words text-sm leading-6">{parsed.body || item.content}</p>

          {(preview?.media_url || logRow?.media_url) ? (
            <div
              aria-hidden="true"
              className="h-64 w-full rounded-md border bg-center bg-cover"
              style={{ backgroundImage: `url("${preview?.media_url || logRow?.media_url}")` }}
            />
          ) : null}

          {parsed.hashtags ? <p className="break-words text-sky-600 text-sm">{parsed.hashtags}</p> : null}

          <div className="flex flex-wrap items-center gap-2">
            {logRow?.retry_count ? (
              <span className="text-muted-foreground text-xs">
                {t("log.retry")}: {logRow.retry_count}
              </span>
            ) : null}
            {logRow?.x_tweet_id && platform === "twitter" ? (
              <a
                href={buildTweetUrl(logRow.x_tweet_id)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-primary text-xs hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                {t("log.viewOnX")}
              </a>
            ) : null}
            {logRow?.external_post_id && platform !== "twitter" ? (
              <span className="text-muted-foreground text-xs">
                {t("log.externalPostId")}: {logRow.external_post_id}
              </span>
            ) : null}
            {mode === "log" && logRow && (logRow.status === "queued" || logRow.status === "failed") ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-destructive text-xs"
                disabled={canceling}
                onClick={() => onCancel?.(logRow.id)}
              >
                <XCircle className="mr-1 h-3 w-3" />
                {t("log.cancel")}
              </Button>
            ) : null}
          </div>

          {logRow?.error_message ? <p className="text-destructive text-xs">{logRow.error_message}</p> : null}
        </div>
      </div>
    </div>
  );
}
