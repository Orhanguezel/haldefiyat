// =============================================================
// FILE: src/app/(main)/admin/_components/social/social-templates-panel.tsx
// Şablonlar — ekosistem content_templates (read-only)
// =============================================================

"use client";

import { useAdminT } from "@/app/(main)/admin/_components/common/use-admin-t";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSocialTemplatesQuery } from "@/integrations/hooks";
import type { SocialFeedPlatform } from "@/integrations/shared";

export default function SocialTemplatesPanel({ platform }: { platform: SocialFeedPlatform }) {
  const t = useAdminT("admin.social");
  const { data, isLoading } = useSocialTemplatesQuery({ platform });
  const items = data?.items ?? [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("templates.title")}</CardTitle>
          <CardDescription>{t("templates.description")}</CardDescription>
        </CardHeader>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">{t("templates.loading")}</CardContent>
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">{t("templates.empty")}</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((tpl) => (
            <Card key={tpl.id}>
              <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
                <CardTitle className="text-sm">{tpl.name}</CardTitle>
                {tpl.isActive ? null : <Badge variant="secondary">{t("templates.inactive")}</Badge>}
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="whitespace-pre-wrap rounded-md bg-muted/40 p-3 text-sm">{tpl.captionTemplate}</p>
                {tpl.hashtags ? <p className="text-xs text-sky-500">{tpl.hashtags}</p> : null}
                {tpl.variables?.length ? (
                  <p className="text-xs text-muted-foreground">
                    {t("templates.variables")}: {tpl.variables.map((v) => `{{${v}}}`).join(" ")}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
