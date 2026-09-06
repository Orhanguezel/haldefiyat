import {describe,expect,test} from 'bun:test';
import {checkoutAttributionMetadata,editorialPaymentEvidence,sanitizeBillingAttribution} from '../src/modules/billing/attribution';
const attrs={utm_source:'instagram',utm_medium:'social',utm_campaign:'eylul-2026',utm_content:'k4:2026-09-06'};
const event=(object:Record<string,unknown>={}, type='invoice.payment_succeeded')=>({id:'evt_test',type,livemode:true,data:{object:{id:'in_test',status:'paid',currency:'try',amount_paid:9900,parent:{subscription_details:{metadata:attrs}},...object}}});
describe('editorial billing attribution',()=>{
 test('whitelists campaign labels, excludes sensitive/free-form inputs and forged series',()=>{
   expect(sanitizeBillingAttribution({...attrs,user_id:'forged',gclid:'click',first_path:'/account?email=a',utm_term:'contact',content_series:'k1'})).toEqual({...attrs,content_series:'k4'});
   expect(sanitizeBillingAttribution({utm_source:'a@example.com',utm_medium:'https://x',utm_campaign:'x'.repeat(121),utm_content:'k40:2026'})).toEqual({utm_content:'k40:2026'});
   expect(sanitizeBillingAttribution(null)).toEqual({});
 });
 test('checkout and subscription carry the same sanitized labels and authoritative user',()=>{
   const result=checkoutAttributionMetadata('real-user',{...attrs,user_id:'forged'});
   expect(result.metadata.user_id).toBe('real-user');
   expect(result.subscription_data.metadata).toEqual(result.metadata);
   expect(result.metadata.content_series).toBe('k4');
 });
 test('recognizes only actual positive live invoice payment, never trial/session/status',()=>{
   expect(editorialPaymentEvidence(event())?.amountPaidMinor).toBe(9900);
   expect(editorialPaymentEvidence(event({amount_paid:0}))).toBeNull();
   expect(editorialPaymentEvidence(event({amount_paid:'9900'}))).toBeNull();
   expect(editorialPaymentEvidence(event({status:'open'}))).toBeNull();
   expect(editorialPaymentEvidence({...event(),livemode:false})).toBeNull();
   expect(editorialPaymentEvidence(event({},'checkout.session.completed'))).toBeNull();
   expect(editorialPaymentEvidence(event({},'customer.subscription.updated'))).toBeNull();
 });
 test('supports legacy invoice metadata while unrelated invoices stay unattributed',()=>{
   expect(editorialPaymentEvidence(event({parent:undefined,subscription_details:{metadata:attrs}}))?.content_series).toBe('k4');
   expect(editorialPaymentEvidence(event({parent:undefined,metadata:{}}))).toBeNull();
 });
});
