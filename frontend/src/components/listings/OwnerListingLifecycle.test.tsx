import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import type {Listing} from '@/lib/api';
import {apiDelete,apiPost} from '@/lib/api-client';
import {OwnerListingLifecycle} from './OwnerListingLifecycle';
import {OwnerListingSummary} from './OwnerListingSummary';
vi.mock('@/lib/api-client',()=>({apiDelete:vi.fn(),apiPost:vi.fn(),ApiError:class extends Error{}}));
const item={id:21,slug:'domates-istanbul-21',title:'Domates ilanı',status:'approved',validUntil:'2020-09-10',productName:'Domates'} as Listing;
afterEach(()=>{cleanup();vi.clearAllMocks();});
it('routes expired owner cards to private preview instead of a public 404',()=>{
 render(<OwnerListingSummary item={item}/>);
 expect(screen.getByRole('link',{name:'İlanı incele'})).toHaveAttribute('href','/hesabim/ilanlarim/21');
 expect(screen.queryByRole('link',{name:'Yayındaki ilanı aç'})).toBeNull();
 expect(screen.getByText(/İlanın süresi dolmuş/)).toBeInTheDocument();
});
it('requires explicit confirmation before deletion',async()=>{
 vi.mocked(apiDelete).mockResolvedValue({ok:true});const done=vi.fn();
 render(<OwnerListingLifecycle item={item} onRenewed={vi.fn()} onDeleted={done}/>);
 fireEvent.click(screen.getByRole('button',{name:'İlanı sil'}));expect(apiDelete).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole('button',{name:'Evet, ilanı sil'}));
 await waitFor(()=>expect(done).toHaveBeenCalledOnce());expect(apiDelete).toHaveBeenCalledWith('/listings/21');
});
it('submits the selected future date for moderation',async()=>{
 vi.mocked(apiPost).mockResolvedValue({ok:true});const done=vi.fn();
 render(<OwnerListingLifecycle item={item} onRenewed={done} onDeleted={vi.fn()}/>);
 fireEvent.click(screen.getByRole('button',{name:'Süreyi uzat'}));
 fireEvent.change(screen.getByLabelText(/Yeni son tarih/),{target:{value:'2099-01-01'}});
 fireEvent.click(screen.getByRole('button',{name:'Süreyi uzat ve onaya gönder'}));
 await waitFor(()=>expect(done).toHaveBeenCalledOnce());expect(apiPost).toHaveBeenCalledWith('/listings/21/renew',{validUntil:'2099-01-01'});
});
