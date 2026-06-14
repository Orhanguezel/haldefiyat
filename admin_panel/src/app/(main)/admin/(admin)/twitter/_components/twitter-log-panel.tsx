"use client";

import { DownloadCloud, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { useAdminT } from "@/app/(main)/admin/_components/common/use-admin-t";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useTwitterCancelTweetMutation,
  useTwitterListTweetsQuery,
  useTwitterSyncHistoryMutation,
} from "@/integrations/hooks";
import type { SocialPlatform, TweetLogRow, TweetStatus } from "@/integrations/shared";

import { TwitterTweetCard } from "./twitter-tweet-card";

const LIMIT = 50;

type TwitterLogPanelProps = {
  scope: "queue" | "history";
  platform: SocialPlatform;
};

function byNewest(a: TweetLogRow, b: TweetLogRow) {
  const aTime = Date.parse(a.posted_at || a.scheduled_at || a.created_at);
  const bTime = Date.parse(b.posted_at || b.scheduled_at || b.created_at);
  return bTime - aTime;
}

function useRows(platform: SocialPlatform, statuses: TweetStatus[]) {
  const queued = useTwitterListTweetsQuery({ platform, status: "queued", limit: LIMIT });
  const posting = useTwitterListTweetsQuery({ platform, status: "posting", limit: LIMIT });
  const sent = useTwitterListTweetsQuery({ platform, status: "sent", limit: LIMIT });
  const failed = useTwitterListTweetsQuery({ platform, status: "failed", limit: LIMIT });
  const canceled = useTwitterListTweetsQuery({ platform, status: "canceled", limit: LIMIT });

  const queries = { queued, posting, sent, failed, canceled };
  const active = statuses.map((status) => queries[status]);
  const rows = active.flatMap((query) => query.data?.items ?? []).sort(byNewest);

  return {
    rows,
    isLoading: active.some((query) => query.isLoading),
    isFetching: active.some((query) => query.isFetching),
    refetch: () => active.forEach((query) => void query.refetch()),
  };
}

export default function TwitterLogPanel({ scope, platform }: TwitterLogPanelProps) {
  const t = useAdminT("admin.twitter");
  const statuses: TweetStatus[] = scope === "queue" ? ["queued", "posting"] : ["sent", "failed", "canceled"];
  const { rows, isLoading, isFetching, refetch } = useRows(platform, statuses);
  const [cancelTweet, { isLoading: canceling }] = useTwitterCancelTweetMutation();
  const [syncHistory, { isLoading: syncing }] = useTwitterSyncHistoryMutation();

  const handleCancel = async (id: string) => {
    try {
      await cancelTweet(id).unwrap();
      toast.success(t("log.cancelDone"));
      refetch();
    } catch {
      toast.error(t("log.cancelFailed"));
    }
  };

  const handleSyncHistory = async () => {
    try {
      const res = await syncHistory().unwrap();
      toast.success(t("log.syncDone", { imported: res.imported, skipped: res.skipped }));
      refetch();
    } catch {
      toast.error(t("log.syncFailed"));
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>
          {scope === "queue" ? t("log.queueTitle") : t("log.historyTitle")} ({rows.length})
        </CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          {scope === "history" ? (
            <Button variant="outline" size="sm" onClick={handleSyncHistory} disabled={syncing}>
              <DownloadCloud className="mr-2 h-4 w-4" />
              {syncing ? t("log.syncing") : t("log.syncHistory")}
            </Button>
          ) : null}
          <Button variant="outline" size="sm" onClick={refetch} disabled={isFetching}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {t("log.refresh")}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <p className="py-6 text-muted-foreground text-sm">{t("log.loading")}</p>
        ) : rows.length === 0 ? (
          <p className="py-6 text-muted-foreground text-sm">
            {scope === "queue" ? t("log.queueEmpty") : t("log.historyEmpty")}
          </p>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => (
              <TwitterTweetCard
                key={row.id}
                item={row}
                onCancel={(id) => void handleCancel(id)}
                canceling={canceling}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
