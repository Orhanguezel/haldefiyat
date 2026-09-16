import {test,expect,mock} from 'bun:test';
const saved:any[]=[];
const sent:any[]=[];
mock.module('@/db/client',()=>({db:{execute:async()=>[[{id:7,slug:'test',title:'Elma',name:'Üretici',email:'test@example.com',validUntil:'2026-09-29'}]],insert:()=>({values:async(v:any)=>{saved.push(v)}})}}));
mock.module('@agro/shared-backend/core/mail',()=>({sendBereketMail:async(v:any)=>{sent.push(v)}}));
const {sendListingExpiryReminders,buildHtml}=await import('../src/modules/listings/expiry-reminder');
test('expiry cycle is part of reminder key and owner receives exact listing link',async()=>{
 await sendListingExpiryReminders(3);
 expect(saved[0].kind).toBe('expiry_3d_2026-09-29');
 expect(sent[0].html).toContain('/hesabim/ilanlarim/7');
 expect(sent[0].html).toContain('29 Eylül 2026');
 expect(sent[0].html).not.toContain('Invalid Date');
});
test('last-day reminder explains closure and escapes listing title',()=>{
 const html=buildHtml({id:7,name:'Test',title:'<img>',slug:'test',validUntil:'2026-09-29',daysBefore:0});
 expect(html).toContain('Bugün son gün');
 expect(html).toContain('&lt;img&gt;');
});
