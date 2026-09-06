/** Default read-only. --apply regenerates only a draft; never publishes or approves. */
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { hfAnalysisReports } from '@/db/schema';
import { generateMonthlyReport, persistMonthlyReport, resolveMonthRange, seasonShift } from '@/modules/analysis/monthly-report';
const month = process.argv.find(a => /^\d{4}-\d{2}$/.test(a)) ?? '2026-08';
const range = resolveMonthRange(month);
const [existing] = await db.select({ id: hfAnalysisReports.id, status: hfAnalysisReports.status, reviewedAt: hfAnalysisReports.reviewedAt }).from(hfAnalysisReports).where(eq(hfAnalysisReports.isoWeek, range.monthKey)).limit(1);
if (existing && existing.status !== 'draft') throw new Error('Only draft regeneration is permitted');
const previousDate = new Date(`${range.monthStart}T12:00:00Z`); previousDate.setUTCMonth(previousDate.getUTCMonth()-1);
const coverage = await seasonShift(range, resolveMonthRange(previousDate.toISOString().slice(0,7)));
const draft = await generateMonthlyReport(month);
if (!draft) throw new Error('Insufficient monthly records');
if (draft.content.includes('Sezonu kapanan') || draft.content.includes('tezgâha giren')) throw new Error('Unverified season claim');
let saved = null;
if (process.argv.includes('--apply')) {
  const row = await persistMonthlyReport(month);
  if (!row || row.status !== 'draft' || row.reviewedAt || row.reviewedBy || row.publishedAt) throw new Error('Draft-only invariant failed');
  saved = { id: row.id, status: row.status, reviewedAt: row.reviewedAt, publishedAt: row.publishedAt };
}
console.log(JSON.stringify({month, existing, coverage, title: draft.title, content: draft.content, saved}, null, 2));
process.exit(0);
