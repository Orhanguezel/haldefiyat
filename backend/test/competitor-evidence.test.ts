import { expect, test } from 'bun:test';
import { comparisonIssue } from '../src/modules/competitor-monitor/comparison';
import { parseCompetitorHtml, buildDiffSummary, measuredSnapshot } from '../src/modules/competitor-monitor/parser';
import { domainOf } from '../src/modules/competitor-monitor/serp-bing';
const ok = { status: 'ok', depth: 20, queries_total: 2, queries_done: 2, actual_engines: 1, unknown_engines: 0, actual_engine: 'brave', query_count: 2 };
test('partial/unknown/mixed/incomplete evidence never becomes a loss', () => {
  expect(comparisonIssue(ok)).toBeNull();
  for (const change of [{ status: 'partial' }, { actual_engines: 2 }, { unknown_engines: 1 }, { depth: null }, { query_count: 1 }, { queries_done: 1 }]) expect(comparisonIssue({ ...ok, ...change })).not.toBeNull();
});
test('tracked hostname ignores path/query substrings', () => {
  expect(domainOf('https://www.harmanapps.com/page')).toBe('harmanapps.com');
  expect(domainOf('https://example.com/harmanapps.com?q=harmanapps.com')).not.toBe('harmanapps.com');
  expect(domainOf('https://notharmanapps.com')).not.toBe('harmanapps.com');
});
test('markup and invalid JSON do not invent catalog totals or no-change claims', () => {
  const curr = parseCompetitorHtml('guncelfiyatlari', '<table>'+ '<tr><td>foo</td></tr>'.repeat(40) + '</table>');
  expect(curr.productCount).toBeNull();
  expect(curr.rawMetrics.pageProductEntities).toBeNull();
  expect(buildDiffSummary({productCount:40,marketCount:null,detectedFeatures:[]}, curr)).toContain('karşılaştırılamıyor');
});
test('structured entities deduplicate and retain page scope', () => {
 const curr = parseCompetitorHtml('any', `<script type="application/ld+json">{"@graph":[{"@type":"Product","@id":"a"},{"@type":"Product","@id":"a"},{"@type":["Thing","Product"],"name":"b"}]}</script>`);
 expect(curr.productCount).toBeNull(); expect(curr.rawMetrics.pageProductEntities).toBe(2);
 const broken = parseCompetitorHtml('any', '<script type="application/ld+json">oops</script>');
 expect(broken.rawMetrics.pageProductEntities).toBeNull();
});

test('legacy DOM counts are retained in storage but not exposed as verified totals', () => {
 const old={productCount:40,marketCount:3,diffSummary:'Değişiklik yok.',rawMetrics:{tableRowCount:42}};
 const output=measuredSnapshot(old);
 expect(output.productCount).toBeNull(); expect(output.marketCount).toBeNull();
 expect(output.diffSummary).toContain('Eski sezgisel'); expect(old.productCount).toBe(40);
});
