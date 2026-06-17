// =============================================================
// FILE: src/app/(main)/admin/(admin)/twitter/_components/twitter-plan-panel.tsx
// Platform içerik planı (seed: 182-185, social_content_plans)
// =============================================================

'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { useAdminT } from '@/app/(main)/admin/_components/common/use-admin-t';
import { useTwitterPlansQuery } from '@/integrations/hooks';
import { planDayKey, type SocialPlatform, type TwitterPlanRow } from '@/integrations/shared';

type Props = {
  platform: SocialPlatform;
};

function pad(value: number) {
  return String(value).padStart(2, '0');
}

export default function TwitterPlanPanel({ platform }: Props) {
  const t = useAdminT('admin.twitter');
  const { data, isLoading } = useTwitterPlansQuery({ platform });
  const items = data?.items ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('plan.title')}</CardTitle>
        <CardDescription>{t(`plan.description.${platform}` as 'plan.description.twitter')}</CardDescription>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <p className="py-6 text-muted-foreground text-sm">{t('plan.loading')}</p>
        ) : items.length === 0 ? (
          <p className="py-6 text-muted-foreground text-sm">{t('plan.empty')}</p>
        ) : (
          <div className="space-y-2">
            {items.map((row: TwitterPlanRow) => (
              <div
                key={row.id}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-3"
              >
                <Badge variant="outline">
                  {t(`plan.days.${planDayKey(row.day_of_week)}`)} {pad(row.hour)}:{pad(row.minute)}
                </Badge>
                <Badge variant="secondary">{row.template}</Badge>
                {row.post_format === 'story' ? <Badge>{t('plan.story')}</Badge> : null}
                {row.media_required ? <Badge variant="outline">{t('plan.mediaRequired')}</Badge> : null}
                <span className="text-sm">
                  <span className="font-medium">{row.pillar}</span>
                  {row.topic ? <span className="text-muted-foreground"> — {row.topic}</span> : null}
                </span>
                {row.preferred_product ? (
                  <Badge variant="outline">{row.preferred_product}</Badge>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
