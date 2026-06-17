// =============================================================
// FILE: src/app/(main)/admin/_components/social/social-plan-panel.tsx
// Plan / Strateji — hal social_content_plans (haftalık otomasyon slotları)
// =============================================================

"use client";

import { toast } from "sonner";

import { useAdminT } from "@/app/(main)/admin/_components/common/use-admin-t";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSocialPlanQuery, useSocialUpdatePlanMutation } from "@/integrations/hooks";
import { getErrorMessage, type SocialFeedPlatform } from "@/integrations/shared";

const SLOT_LABELS: Record<string, string> = {
  morning: "Sabah (Hareketler)",
  popular: "Öğle (Popüler ürünler)",
  midday: "Öğle",
  evening: "Akşam",
  weekly: "Haftalık (Analiz)",
};

function fmtTime(h: number, m: number): string {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default function SocialPlanPanel({ platform }: { platform: SocialFeedPlatform }) {
  const t = useAdminT("admin.social");
  const { data, isLoading } = useSocialPlanQuery({ platform });
  const [updatePlan, { isLoading: updating }] = useSocialUpdatePlanMutation();
  const items = data?.items ?? [];

  const handleToggle = async (id: string, is_active: boolean) => {
    try {
      await updatePlan({ id, is_active }).unwrap();
      toast.success(is_active ? t("plan.enabled") : t("plan.disabled"));
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

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
              <TableHead>{t("plan.cols.slot")}</TableHead>
              <TableHead>{t("plan.cols.time")}</TableHead>
              <TableHead>{t("plan.cols.template")}</TableHead>
              <TableHead>{t("plan.cols.topic")}</TableHead>
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
                <TableCell>{SLOT_LABELS[p.slot_key] ?? p.slot_key}</TableCell>
                <TableCell>{fmtTime(p.hour, p.minute)}</TableCell>
                <TableCell className="max-w-[220px] truncate">{p.template || p.slot_key}</TableCell>
                <TableCell className="max-w-[220px] truncate">{p.topic || p.pillar || "—"}</TableCell>
                <TableCell>
                  <Switch
                    checked={!!p.is_active}
                    disabled={updating}
                    onCheckedChange={(v) => handleToggle(p.id, v)}
                    aria-label={p.is_active ? t("plan.active") : t("plan.inactive")}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
