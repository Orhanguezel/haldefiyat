import { describe, expect, test } from 'bun:test';
import { isValidReportRange, previousComparableRange, reportPresetRange } from './report-range';

describe('banner report date ranges', () => {
  const now = new Date(2026, 8, 6, 12);

  test('current month is month-to-date in local calendar dates', () => {
    expect(reportPresetRange('current_month', now)).toEqual({ from: '2026-09-01', to: '2026-09-06' });
  });

  test('previous month includes its complete calendar month', () => {
    expect(reportPresetRange('previous_month', now)).toEqual({ from: '2026-08-01', to: '2026-08-31' });
  });

  test('comparison uses the immediately preceding equal-length period', () => {
    expect(previousComparableRange({ from: '2026-09-01', to: '2026-09-06' })).toEqual({ from: '2026-08-26', to: '2026-08-31' });
  });

  test('rejects reversed date ranges', () => {
    expect(isValidReportRange({ from: '2026-09-06', to: '2026-09-01' })).toBe(false);
  });
});
