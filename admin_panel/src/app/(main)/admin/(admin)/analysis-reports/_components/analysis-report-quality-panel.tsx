'use client';

import { AlertTriangle, CheckCircle2, Globe, HelpCircle, RefreshCw, Search, ShieldCheck, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type {
  AnalysisReportQuality,
  GscIndexCategory,
  QualityBreakItem,
} from '@/integrations/endpoints/analysis-reports-admin-endpoints';
import {
  useGetAnalysisReportQualityAdminQuery,
  useInspectAnalysisReportAdminMutation,
} from '@/integrations/hooks';

function scoreVariant(score: number): 'default' | 'secondary' | 'destructive' {
  if (score >= 75) return 'default';
  if (score >= 45) return 'secondary';
  return 'destructive';
}

function scoreLabel(score: number): string {
  if (score >= 75) return 'İyi';
  if (score >= 45) return 'Orta';
  return 'Zayıf';
}

function formatDateTime(value: string | null): string {
  if (!value) return '—';
  return value.replace('T', ' ').slice(0, 16);
}

const gscMeta: Record<GscIndexCategory, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; Icon: typeof CheckCircle2 }> = {
  indexed: { variant: 'default', Icon: CheckCircle2 },
  not_indexed: { variant: 'secondary', Icon: AlertTriangle },
  issue: { variant: 'destructive', Icon: XCircle },
  unknown: { variant: 'outline', Icon: HelpCircle },
};

function ScoreCard({ title, icon, score }: { title: string; icon: React.ReactNode; score: number }) {
  return (
    <div className="rounded-md border p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          {icon}
          {title}
        </div>
        <Badge variant={scoreVariant(score)}>{score}/100 · {scoreLabel(score)}</Badge>
      </div>
      <Progress value={score} />
    </div>
  );
}

function Breakdown({ items }: { items: QualityBreakItem[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li key={item.key} className="flex items-center justify-between gap-3 text-sm">
          <span className="flex items-center gap-2">
            {item.pass ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <span className={item.pass ? '' : 'text-muted-foreground'}>{item.label}</span>
            {item.detail && <span className="text-muted-foreground text-xs">({item.detail})</span>}
          </span>
          <span className="shrink-0 font-mono text-xs text-muted-foreground">
            {item.points}/{item.max}
          </span>
        </li>
      ))}
    </ul>
  );
}

function GscPanel({ data, onInspect, inspecting }: { data: AnalysisReportQuality; onInspect: () => void; inspecting: boolean }) {
  const meta = gscMeta[data.gsc.category];
  const Icon = meta.Icon;
  const isPublished = data.status === 'published';
  return (
    <div className="rounded-md border p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Search className="h-4 w-4" />
          Google Search Console indexlenme
        </div>
        <Button size="sm" variant="outline" onClick={onInspect} disabled={inspecting || !isPublished}>
          <RefreshCw className={`mr-1.5 h-4 w-4 ${inspecting ? 'animate-spin' : ''}`} />
          {inspecting ? 'Denetleniyor...' : "Google'da Denetle"}
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={meta.variant} className="gap-1">
          <Icon className="h-3.5 w-3.5" />
          {data.gsc.label}
        </Badge>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        <dt>Verdict</dt>
        <dd className="text-right text-foreground">{data.gsc.verdict ?? '—'}</dd>
        <dt>Coverage</dt>
        <dd className="text-right text-foreground">{data.gsc.coverageState ?? '—'}</dd>
        <dt>Son tarama (Google)</dt>
        <dd className="text-right text-foreground">{formatDateTime(data.gsc.lastCrawl)}</dd>
        <dt>Son denetim</dt>
        <dd className="text-right text-foreground">{formatDateTime(data.gsc.checkedAt)}</dd>
      </dl>
      <div className="mt-3 flex items-center justify-between gap-2 rounded-md bg-muted/30 p-2 text-xs">
        <span className="truncate text-muted-foreground">{data.gsc.url}</span>
        <a href={data.gsc.url} target="_blank" rel="noreferrer" className="flex shrink-0 items-center gap-1 text-foreground hover:underline">
          <Globe className="h-3.5 w-3.5" /> Aç
        </a>
      </div>
      {!isPublished && (
        <p className="mt-2 text-xs text-muted-foreground">
          Denetim için yazı yayında olmalı. Yeni yayınlanan yazılar Google tarafından birkaç gün içinde taranır.
        </p>
      )}
    </div>
  );
}

interface Props {
  id: string;
  isNew: boolean;
}

export function AnalysisReportQualityPanel({ id, isNew }: Props) {
  const { data, isFetching, refetch } = useGetAnalysisReportQualityAdminQuery({ id }, { skip: isNew });
  const [inspect, { isLoading: inspecting }] = useInspectAnalysisReportAdminMutation();

  if (isNew) {
    return (
      <div className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
        Kalite ve indexlenme ölçümü, yazı kaydedildikten sonra hesaplanır.
      </div>
    );
  }

  if (!data) {
    return <div className="rounded-md border p-4 text-sm text-muted-foreground">{isFetching ? 'Kalite hesaplanıyor...' : 'Kalite verisi yok.'}</div>;
  }

  async function handleInspect() {
    try {
      await inspect({ id: Number(id) }).unwrap();
      await refetch();
      toast.success('Google indexlenme durumu güncellendi');
    } catch {
      toast.error('Denetim başarısız. GSC yetkilendirme/kotayı kontrol edin.');
    }
  }

  return (
    <div className="space-y-4">
      <ScoreCard title="Index hazırlığı" icon={<ShieldCheck className="h-4 w-4" />} score={data.readiness} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">İçerik kalitesi · {data.content.score}/100</CardTitle>
          </CardHeader>
          <CardContent>
            <Breakdown items={data.content.breakdown} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">SEO kalitesi · {data.seo.score}/100</CardTitle>
          </CardHeader>
          <CardContent>
            <Breakdown items={data.seo.breakdown} />
          </CardContent>
        </Card>
      </div>

      <GscPanel data={data} onInspect={handleInspect} inspecting={inspecting} />
    </div>
  );
}
