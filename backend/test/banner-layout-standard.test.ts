import { describe, expect, test } from 'bun:test';
import { AD_FORMATS, adLayoutError, adRectanglesOverlap, adSlotProfile, adCells, adDeviceOverlap } from '../../shared/banner-layout.mjs';
import { bannerTargetsCanOverlap } from '../src/modules/banners/repository';
const card = (format: string, row=1, column=1) => ({position:'home_mid',format,desktopRow:row,gridColumn:column});
describe('deterministic advertisement layout', () => {
 test('two halves and three thirds exactly fill a six-unit row',()=>{
  expect(AD_FORMATS.half.columns*2).toBe(6); expect(AD_FORMATS.third.columns*3).toBe(6);
  expect(adRectanglesOverlap(card('half'),card('half',1,4))).toBeFalse();
  expect(adRectanglesOverlap(card('half'),card('third',1,3))).toBeTrue();
 });
 test('tall occupies both rows and blocks a lower card in its cells',()=>{
  expect(adCells(card('tall'))).toEqual(['1:1','1:2','2:1','2:2']);
  expect(adRectanglesOverlap(card('tall'),card('third',2,1))).toBeTrue();
  expect(adRectanglesOverlap(card('tall'),card('third',2,3))).toBeFalse();
  expect(adLayoutError(card('tall',2))).not.toBeNull();
 });
 test('sidebar does not accept wide formats; strips have one full row',()=>{
  expect(adLayoutError({...card('half'),position:'firm_detail_sidebar'})).not.toBeNull();
  expect(adLayoutError({...card('tall'),position:'firm_detail_sidebar'})).toBeNull();
  expect(adSlotProfile('global_top').formats).toEqual(['full']);
  expect(adLayoutError({...card('full',2),position:'global_top'})).not.toBeNull();
  expect(adLayoutError(card('half',1,5))).not.toBeNull();
 });
 test('device and targeting exclusivity remain separate from geometry',()=>{
  expect(adDeviceOverlap('desktop','mobile')).toBeFalse(); expect(adDeviceOverlap('all','mobile')).toBeTrue();
  expect(bannerTargetsCanOverlap([{scopeType:'city',scopeValue:'ankara'}],[{scopeType:'city',scopeValue:'izmir'}])).toBeFalse();
  expect(bannerTargetsCanOverlap([], [{scopeType:'city',scopeValue:'izmir'}])).toBeTrue();
 });
});
