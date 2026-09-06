import {describe, expect, test} from 'bun:test';
import {canScheduleReport, classifyMonthlyVisibility, selectMonthlyCohort} from '../src/modules/analysis/monthly-cohort';
const source = (marketId: number, nowDays = 23, prevDays = 23) => ({marketId, source:'municipal', name:'Hal', nowDays, prevDays});
const item = {slug:'incir',name:'İncir',now:20,prev:0,nowMarkets:3,prevMarkets:0};
describe('monthly source cohort', () => {
  test('drops interrupted, new and unstable sources, normalizes month lengths', () => {
    expect(selectMonthlyCohort([source(1),source(2,23,0),source(3,0,23),source(4,31,21)],31,31).map(s=>s.marketId)).toEqual([1]);
    expect(selectMonthlyCohort([source(1,21,19)],31,28)).toHaveLength(1);
  });
  test('requires three distinct markets rather than three feeds of one market', () => {
    expect(classifyMonthlyVisibility([item],[source(1),source(1),source(2)]).entering).toEqual([]);
  });
  test('only claims visibility when product has multihal support', () => {
    const cohort=[source(1),source(2),source(3)];
    expect(classifyMonthlyVisibility([item],cohort).entering).toHaveLength(1);
    expect(classifyMonthlyVisibility([{...item,nowMarkets:1}],cohort).entering).toEqual([]);
    expect(classifyMonthlyVisibility([{...item,now:0,prev:20,prevMarkets:3}],cohort).leaving).toHaveLength(1);
  });
  test('unreviewed regenerated and archived reports cannot be scheduled', () => {
    expect(canScheduleReport({status:'draft',reviewedAt:null,reviewedBy:null})).toBe(false);
    expect(canScheduleReport({status:'archived',reviewedAt:new Date(),reviewedBy:'editor'})).toBe(false);
    expect(canScheduleReport({status:'draft',reviewedAt:new Date(),reviewedBy:'editor'})).toBe(true);
  });
});
