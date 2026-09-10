import {act, renderHook, waitFor} from '@testing-library/react';
import {beforeEach, expect, it, vi} from 'vitest';
import {useFavorites} from './useFavorites';
const mocks=vi.hoisted(()=>({auth:{user:null as null|{id:string},loading:true},get:vi.fn(),del:vi.fn()}));
vi.mock('@/components/providers/AuthSessionProvider',()=>({useAuthSession:()=>mocks.auth}));
vi.mock('@/lib/api-client',()=>({apiGet:mocks.get,apiDelete:mocks.del,apiPost:vi.fn()}));
const products=[{slug:'biber-dolma',nameTr:'Biber Dolma',productId:1,unit:'kg',categorySlug:'sebze'}];
beforeEach(()=>{vi.clearAllMocks();localStorage.clear();mocks.auth={user:null,loading:true};mocks.get.mockResolvedValue({items:products});});
it('loads account favorites after delayed cookie session restoration with empty browser storage',async()=>{
 const {result,rerender}=renderHook(()=>useFavorites());
 expect(mocks.get).not.toHaveBeenCalled();expect(result.current.loadingRemote).toBe(true);
 mocks.auth={user:{id:'member'},loading:false};rerender();
 await waitFor(()=>expect(result.current.slugs).toEqual(['biber-dolma']));
 expect(result.current.remoteItems).toEqual(products);
 mocks.auth={user:null,loading:false};rerender();
 await waitFor(()=>expect(result.current.slugs).toEqual([]));
});
it('keeps guest favorites working without requesting an account',async()=>{
 localStorage.setItem('haldefiyat:favorites',JSON.stringify(['domates']));mocks.auth.loading=false;
 const {result}=renderHook(()=>useFavorites());
 await waitFor(()=>expect(result.current.slugs).toEqual(['domates']));expect(mocks.get).not.toHaveBeenCalled();
});
it('reports account loading errors instead of claiming an empty list',async()=>{
 mocks.auth={user:{id:'member'},loading:false};mocks.get.mockRejectedValue(new Error('offline'));
 const {result}=renderHook(()=>useFavorites());
 await waitFor(()=>expect(result.current.error).toBe(true));
 expect(result.current.loadingRemote).toBe(false);
});
