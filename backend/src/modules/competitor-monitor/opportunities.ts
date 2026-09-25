import type { GoogleMetric, GooglePerformanceSnapshot } from './google-performance';

type Priority = 'p1' | 'p2' | 'protect' | 'monitor';

export interface OpportunityInput {
  query: string;
  our_position?: number | string | null;
}

export interface SeoOpportunity {
  query: string;
  priority: Priority;
  score: number;
  current: GoogleMetric;
  previous: GoogleMetric | null;
  scrapePosition: number | null;
  impressionChangePct: number | null;
  clickChangePct: number | null;
  positionChange: number | null;
  potentialClicksAt3Ctr: number;
  signals: Array<'low_ctr' | 'rank_gap' | 'growing' | 'declining' | 'landing_split' | 'engine_gap' | 'misaligned_page'>;
  action: string;
}

export interface OpportunitySummary {
  queries: number;
  impressions: number;
  clicks: number;
  ctr: number;
  previousImpressions: number;
  previousClicks: number;
  previousCtr: number;
  p1: number;
  p2: number;
  protect: number;
  potentialClicksAt3Ctr: number;
}

function queryKey(query: string): string {
  return query.trim().replace(/\s+/g, ' ').toLocaleLowerCase('tr');
}

/**
 * A SERP provider may return no rows for a queried phrase. The run table only
 * stores the requested count, so keep the dashboard at that scope by filling
 * missing rows from the same dated GSC snapshot. These rows intentionally have
 * no scrape position.
 */
export function completeOpportunityInputs(
  inputs: OpportunityInput[],
  google: GooglePerformanceSnapshot,
  targetCount: number,
  preferredQueries: string[] = [],
): OpportunityInput[] {
  const completed = [...inputs];
  const seen = new Set(completed.map((input) => queryKey(input.query)));
  const limit = Math.max(completed.length, Math.min(100, targetCount));
  for (const query of preferredQueries) {
    if (completed.length >= limit) break;
    const key = queryKey(query);
    if (seen.has(key) || !google.queries[key]) continue;
    completed.push({ query: key, our_position: null });
    seen.add(key);
  }
  const candidates = Object.entries(google.queries)
    .filter(([query]) => !queryKey(query).replace(/\s+/g, '').includes('haldefiyat'))
    .sort((a, b) => b[1].impressions - a[1].impressions);
  for (const [query] of candidates) {
    if (completed.length >= limit) break;
    const key = queryKey(query);
    if (seen.has(key)) continue;
    completed.push({ query, our_position: null });
    seen.add(key);
  }
  return completed;
}

const localIntent = /(adana|ankara|antalya|bayrampaşa|bursa|denizli|gaziantep|istanbul|kahramanmaraş|kayseri|kocaeli|konya|mersin)/i;

function pct(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

function significantPages(metric: GoogleMetric): number {
  const threshold = Math.max(25, metric.impressions * 0.05);
  return metric.pages.filter((page) => page.impressions >= threshold).length;
}

function pageMisaligned(query: string, page: string | null): boolean {
  if (!page || !localIntent.test(query)) return false;
  try {
    const pathname = new URL(page).pathname;
    return pathname === '/' || pathname.startsWith('/urun/') || pathname.startsWith('/analiz/');
  } catch {
    return false;
  }
}

function actionFor(signals: SeoOpportunity['signals'], priority: Priority): string {
  if (priority === 'protect') return 'Çalışan sayfayı koru; 14 ve 28 günlük değişimi izle.';
  if (signals.includes('misaligned_page') || signals.includes('landing_split')) return 'Hedef URL rolünü ve iç bağlantıları netleştir.';
  if (signals.includes('low_ctr')) return 'Başlık, açıklama ve ilk ekran teklifini iyileştir.';
  if (signals.includes('rank_gap')) return 'İç bağlantı ve içerik derinliğini güçlendir.';
  return 'Talebi izle; yeni müdahale için 28 günlük kanıt bekle.';
}

export function buildSeoOpportunities(inputs: OpportunityInput[], google: GooglePerformanceSnapshot): { items: SeoOpportunity[]; summary: OpportunitySummary } {
  const items = inputs.flatMap((input): SeoOpportunity[] => {
    const current = google.queries[input.query];
    if (!current) return [];
    const previous = google.previousQueries[input.query] ?? null;
    const scrapePosition = input.our_position == null ? null : Number(input.our_position);
    const lowCtr = current.ctr < 0.03;
    const rankGap = current.position > 5;
    const growing = previous ? (pct(current.impressions, previous.impressions) ?? 0) >= 20 : false;
    const declining = previous ? (pct(current.impressions, previous.impressions) ?? 0) <= -20 : false;
    const landingSplit = significantPages(current) >= 2;
    const engineGap = scrapePosition != null && Math.abs(scrapePosition - current.position) >= 5;
    const misalignedPage = pageMisaligned(input.query, current.page);
    const highDemand = current.impressions >= 1_500;
    const mediumDemand = current.impressions >= 750;
    const protect = current.position <= 3.5 && current.ctr >= 0.05 && !landingSplit && !misalignedPage;
    const priority: Priority = protect
      ? 'protect'
      : highDemand && (lowCtr || rankGap || landingSplit || misalignedPage)
        ? 'p1'
        : mediumDemand && (current.ctr < 0.04 || current.position > 4 || landingSplit || misalignedPage)
          ? 'p2'
          : 'monitor';
    const signals: SeoOpportunity['signals'] = [];
    if (lowCtr) signals.push('low_ctr');
    if (rankGap) signals.push('rank_gap');
    if (growing) signals.push('growing');
    if (declining) signals.push('declining');
    if (landingSplit) signals.push('landing_split');
    if (engineGap) signals.push('engine_gap');
    if (misalignedPage) signals.push('misaligned_page');
    const potentialClicksAt3Ctr = Math.max(0, Math.round(current.impressions * 0.03 - current.clicks));
    const score = (priority === 'p1' ? 300 : priority === 'p2' ? 200 : priority === 'protect' ? 100 : 0)
      + Math.min(99, Math.round(current.impressions / 100));
    return [{
      query: input.query,
      priority,
      score,
      current,
      previous,
      scrapePosition,
      impressionChangePct: previous ? pct(current.impressions, previous.impressions) : null,
      clickChangePct: previous ? pct(current.clicks, previous.clicks) : null,
      positionChange: previous ? current.position - previous.position : null,
      potentialClicksAt3Ctr,
      signals,
      action: actionFor(signals, priority),
    }];
  }).sort((a, b) => b.score - a.score || b.current.impressions - a.current.impressions);

  const summary = items.reduce<OpportunitySummary>((acc, item) => {
    acc.queries += 1;
    acc.impressions += item.current.impressions;
    acc.clicks += item.current.clicks;
    acc.previousImpressions += item.previous?.impressions ?? 0;
    acc.previousClicks += item.previous?.clicks ?? 0;
    acc.potentialClicksAt3Ctr += item.potentialClicksAt3Ctr;
    if (item.priority === 'p1') acc.p1 += 1;
    if (item.priority === 'p2') acc.p2 += 1;
    if (item.priority === 'protect') acc.protect += 1;
    return acc;
  }, { queries: 0, impressions: 0, clicks: 0, ctr: 0, previousImpressions: 0, previousClicks: 0, previousCtr: 0, p1: 0, p2: 0, protect: 0, potentialClicksAt3Ctr: 0 });
  summary.ctr = summary.impressions > 0 ? summary.clicks / summary.impressions : 0;
  summary.previousCtr = summary.previousImpressions > 0 ? summary.previousClicks / summary.previousImpressions : 0;
  return { items, summary };
}
