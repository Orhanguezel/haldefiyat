import {expect,test} from 'bun:test';
import {featurePaymentBlock} from './feature-eligibility';
const row={status:'approved',validUntil:'2099-01-01',isFeatured:0,featuredUntil:null};
test('a real approved listing can pay',()=>expect(featurePaymentBlock(row,7)).toBeNull());
test('pending and rehearsal listings cannot pay even when marked approved',()=>{
 expect(featurePaymentBlock({...row,status:'pending'},7)).toContain('yayın onayı');
 expect(featurePaymentBlock({...row,description:'PROVA ILANI — sistem denemesi'},1)).toContain('test/prova');
 expect(featurePaymentBlock({...row,raw:{isTest:true}},1)).toContain('test/prova');
});
test('a package must fit the remaining listing duration',()=>expect(featurePaymentBlock({...row,validUntil:'2098-09-17'},7,new Date('2098-09-11T12:00:00Z'))).toContain('18.09.2098'));
