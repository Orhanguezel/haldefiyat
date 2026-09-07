export interface RunEvidence {
  status: unknown; depth: unknown; queries_total: unknown; queries_done: unknown;
  actual_engines: unknown; unknown_engines: unknown; actual_engine: unknown;
  query_count: unknown;
}
export function comparisonIssue(run: RunEvidence | undefined): string | null {
  if (!run) return 'Tarama bulunamadı.';
  if (run.status !== 'ok' || Number(run.queries_done) !== Number(run.queries_total)) return 'Tarama tamamlanmadı veya bazı sonuç sayfaları alınamadı; kayıp hesabı yapılmaz.';
  if (!Number(run.depth)) return 'Eski taramanın ölçüm derinliği bilinmiyor.';
  if (Number(run.actual_engines) !== 1 || Number(run.unknown_engines) !== 0) return 'Sonuçlarda tek ve doğrulanmış arama motoru bilgisi yok.';
  if (!Number(run.queries_total) || Number(run.query_count) !== Number(run.queries_total)) return 'Tüm sorgular için karşılaştırılabilir sonuç kanıtı yok.';
  return null;
}
