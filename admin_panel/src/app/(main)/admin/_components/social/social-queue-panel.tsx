// =============================================================
// FILE: src/app/(main)/admin/_components/social/social-queue-panel.tsx
// Taslak & Kuyruk — ekosistem posts (draft/scheduled/failed) + iptal
// =============================================================

"use client";

import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useAdminT } from "@/app/(main)/admin/_components/common/use-admin-t";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSocialDeletePostMutation, useSocialPostsQuery } from "@/integrations/hooks";
import { getErrorMessage, type SocialFeedPlatform, type SocialPostRow, type SocialPostStatus } from "@/integrations/shared";

const STATUS_VARIANT: Record<SocialPostStatus, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "secondary",
  scheduled: "default",
  publishing: "default",
  posted: "default",
  failed: "destructive",
  cancelled: "outline",
};

function fmt(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(d);
}

export default function SocialQueuePanel({ platform }: { platform: SocialFeedPlatform }) {
  const t = useAdminT("admin.social");
  const { data, isLoading } = useSocialPostsQuery({ platform, scope: "queue" });
  const [deletePost, { isLoading: deleting }] = useSocialDeletePostMutation();
  const items = data?.items ?? [];

  const handleDelete = async (row: SocialPostRow) => {
    if (!confirm(t("queue.deleteConfirm"))) return;
    try {
      await deletePost(row.id).unwrap();
      toast.success(t("queue.deleted"));
    } catch (err) {
      toast.error(`${t("queue.deleteFailed")}: ${getErrorMessage(err)}`);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("queue.title")}</CardTitle>
          <CardDescription>{t("queue.description")}</CardDescription>
        </CardHeader>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">{t("queue.loading")}</CardContent>
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">{t("queue.empty")}</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((row) => (
            <Card key={row.id}>
              <CardContent className="flex items-start gap-3 p-4">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={STATUS_VARIANT[row.status] ?? "secondary"}>{t(`status.${row.status}` as "status.draft")}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {t("queue.scheduledFor")}: {fmt(row.scheduledAt)}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap break-words text-sm">{row.caption}</p>
                  {row.hashtags ? <p className="text-xs text-sky-500">{row.hashtags}</p> : null}
                  {row.errorMessage ? <p className="text-xs text-destructive">{row.errorMessage}</p> : null}
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(row)} disabled={deleting} title={t("queue.delete")}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
