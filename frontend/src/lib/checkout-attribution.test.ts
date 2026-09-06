import {afterEach,expect,it} from 'vitest';
import {getCheckoutAttribution} from './attribution';
afterEach(()=>{localStorage.clear();document.cookie='hf_attr=; Max-Age=0; Path=/';});
it('passes only permitted campaign fields after consent and stops after revocation',()=>{
 document.cookie=`hf_attr=${encodeURIComponent(JSON.stringify({utm_source:'instagram',utm_content:'k4:2026',first_path:'/private',landed_at:'2026-09-06',gclid:'secret-click'}))}; Path=/`;
 expect(getCheckoutAttribution()).toBeUndefined();
 localStorage.setItem('hf_cookie_consent','accepted');
 expect(getCheckoutAttribution()).toEqual({utm_source:'instagram',utm_content:'k4:2026'});
 localStorage.setItem('hf_cookie_consent','rejected');
 expect(getCheckoutAttribution()).toBeUndefined();
});
