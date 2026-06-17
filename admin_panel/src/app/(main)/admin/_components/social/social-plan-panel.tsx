// =============================================================
// FILE: src/app/(main)/admin/_components/social/social-plan-panel.tsx
// Plan / Strateji — ekosistem içerik takvimi (read-only)
// =============================================================

"use client";

import { useAdminT } from "@/app/(main)/admin/_components/common/use-admin-t";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSocialPlanQuery } from "@/integrations/hooks";
import type { SocialFeedPlatform } from "@/integrations/shared";

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(d);
}

export default function SocialPlanPanel({ platform }: { platform: SocialFeedPlatform }) {
  const t = useAdminT("admin.social");
  const { data, isLoading } = useSocialPlanQuery({ platform });
  const items = data?.items ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("plan.title")}</CardTitle>
        <CardDescription>{t("plan.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("plan.cols.date")}</TableHead>
              <TableHead>{t("plan.cols.slot")}</TableHead>
              <TableHead>{t("plan.cols.type")}</TableHead>
              <TableHead>{t("plan.cols.note")}</TableHead>
              <TableHead>{t("plan.cols.status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5}>{t("plan.loading")}</TableCell>
              </TableRow>
            )}
            {!isLoading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">
                  {t("plan.empty")}
                </TableCell>
              </TableRow>
            )}
            {items.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{fmtDate(p.date)}</TableCell>
                <TableCell>{p.timeSlot}</TableCell>
                <TableCell>{p.postType}</TableCell>
                <TableCell className="max-w-[280px] truncate">{p.notes || "—"}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{p.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
