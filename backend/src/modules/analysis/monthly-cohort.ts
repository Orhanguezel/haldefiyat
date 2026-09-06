/** Calendar-day observation coverage is a proxy for source continuity, not a harvest calendar. */
export const MIN_COHORT_MARKETS = 3;
export const MIN_SOURCE_COVERAGE = 0.65;
export const MAX_COVERAGE_DRIFT = 0.15;
export type SourceCoverage = { marketId: number; source: string; name: string; nowDays: number; prevDays: number };
export type VisibilityItem = { slug: string; name: string; now: number; prev: number; nowMarkets: number; prevMarkets: number };
export function selectMonthlyCohort(sources: SourceCoverage[], nowCalendarDays: number, prevCalendarDays: number) {
  return sources.filter(s => !!s.source.trim() && s.nowDays / nowCalendarDays >= MIN_SOURCE_COVERAGE
    && s.prevDays / prevCalendarDays >= MIN_SOURCE_COVERAGE
    && Math.abs(s.nowDays / nowCalendarDays - s.prevDays / prevCalendarDays) <= MAX_COVERAGE_DRIFT);
}
export function classifyMonthlyVisibility(items: VisibilityItem[], sources: SourceCoverage[], limit = 8) {
  const qualified = new Set(sources.map(s => s.marketId)).size >= MIN_COHORT_MARKETS;
  const sorted = [...items].sort((a, b) => a.slug.localeCompare(b.slug));
  return {
    qualified, sources,
    entering: qualified ? sorted.filter(i => i.prev < 4 && i.now >= 15 && i.nowMarkets >= MIN_COHORT_MARKETS).slice(0, limit) : [],
    leaving: qualified ? sorted.filter(i => i.now < 4 && i.prev >= 15 && i.prevMarkets >= MIN_COHORT_MARKETS).slice(0, limit) : [],
  };
}
/** Regeneration invalidates approval; archived and unreviewed drafts must never auto-publish. */
export function canScheduleReport(report: { status: string; reviewedBy?: string | null; reviewedAt?: Date | null; updatedAt?: Date | null }) {
  return report.status === 'draft' && !!report.reviewedBy && !!report.reviewedAt;
}
