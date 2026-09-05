"use client";

import { useState } from "react";

import { CornerUpRight, Trash2, XOctagon } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useDeleteRedirectAdminMutation,
  useListRedirectsAdminQuery,
  useUpsertRedirectsAdminMutation,
} from "@/integrations/endpoints/admin/redirects-admin-endpoints";
import { useAdminT } from "../../../_components/common/use-admin-t";

// Hedefi normalize et: tam URL ya da "/" ile başlıyorsa olduğu gibi; aksi halde ürün slug → /urun/<slug>.
function normalizeTarget(input: string): string {
  const v = input.trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v) || v.startsWith("/")) return v;
  return `/urun/${v}`;
}

export function ProductRedirectPanel({ slug, isNew }: { slug: string; isNew: boolean }) {
  const t = useAdminT("admin.hf-products.redirect");
  const sourcePath = `/urun/${slug}`;
  const { data } = useListRedirectsAdminQuery({ search: sourcePath }, { skip: isNew || !slug });
  const [upsert, { isLoading: saving }] = useUpsertRedirectsAdminMutation();
  const [remove, { isLoading: removing }] = useDeleteRedirectAdminMutation();
  const [target, setTarget] = useState("");

  if (isNew || !slug) {
    return (
      <div className="rounded-md border bg-muted/30 p-4 text-muted-foreground text-sm">
        {t("afterSave")}
      </div>
    );
  }

  const existing = data?.items?.find((r) => r.sourcePath === sourcePath && r.isActive);

  async function apply(type: "301" | "410") {
    const targetUrl = type === "301" ? normalizeTarget(target) : null;
    if (type === "301" && !targetUrl) {
      toast.error(t("needTarget"));
      return;
    }
    try {
      await upsert({ sourcePath, type, targetUrl }).unwrap();
      toast.success(type === "301" ? t("set301", { target: targetUrl ?? "" }) : t("set410"));
      setTarget("");
    } catch {
      toast.error(t("failed"));
    }
  }

  async function clear() {
    if (!existing) return;
    try {
      await remove(existing.id).unwrap();
      toast.success(t("cleared"));
    } catch {
      toast.error(t("clearFailed"));
    }
  }

  return (
    <div className="rounded-md border p-4">
      <div className="mb-1 flex items-center gap-2 font-medium text-sm">
        <CornerUpRight className="h-4 w-4" />
        {t("title")}
      </div>
      <p className="mb-3 text-muted-foreground text-xs">
        {t("hint", { path: sourcePath })}
      </p>

      {existing ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/30 p-3">
          <div className="flex items-center gap-2 text-sm">
            <Badge variant={existing.type === "410" ? "destructive" : "secondary"}>{existing.type}</Badge>
            {existing.type === "301" ? (
              <span>
                {t("redirecting")} <span className="font-medium">{existing.targetUrl}</span>
              </span>
            ) : (
              <span>{t("gone")}</span>
            )}
          </div>
          <Button size="sm" variant="outline" onClick={clear} disabled={removing}>
            <Trash2 className="mr-1.5 h-4 w-4" />
            {t("clear")}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[220px] flex-1">
              <label className="mb-1 block text-muted-foreground text-xs">{t("targetLabel")}</label>
              <Input placeholder={t("targetPlaceholder")} value={target} onChange={(e) => setTarget(e.target.value)} />
            </div>
            <Button size="sm" onClick={() => apply("301")} disabled={saving}>
              <CornerUpRight className="mr-1.5 h-4 w-4" />
              {t("do301")}
            </Button>
          </div>
          <div className="flex items-center justify-between gap-2 rounded-md border border-destructive/30 p-2">
            <span className="text-muted-foreground text-xs">{t("goneHint")}</span>
            <Button size="sm" variant="destructive" onClick={() => apply("410")} disabled={saving}>
              <XOctagon className="mr-1.5 h-4 w-4" />
              {t("do410")}
            </Button>
          </div>
        </div>
      )}

      <p className="mt-3 text-muted-foreground text-xs">
        {t("tip")}
      </p>
    </div>
  );
}
