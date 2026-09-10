import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { apiGet, apiPost } from "@/lib/api-client";
import type { Listing } from "@/lib/api";
import { ListingFeaturePanel } from "./ListingFeaturePanel";
vi.mock("@/lib/api-client", () => ({apiGet:vi.fn(),apiPost:vi.fn(),ApiError:class extends Error{}}));
const item={id:12,status:"approved",validUntil:"2099-01-01"} as Listing;
const bank={bankName:"Test Banka",accountHolder:"Test Şirket",iban:"TR250001500158007389194294"};
const order={id:"order-1",reference:"HF123",amount:350,status:"unpaid",cancelled:false,days:1,bank};
afterEach(()=>{cleanup();vi.clearAllMocks();});
async function open() {const {container}=render(<ListingFeaturePanel item={item}/>);const d=container.querySelector('details')!;d.open=true;fireEvent(d,new Event('toggle'));}
it("shows server-priced packages and sends only a package key",async()=>{
 vi.mocked(apiGet).mockResolvedValue({bank,pricing:{daily:{days:1,price:350}},items:[]});
 vi.mocked(apiPost).mockResolvedValue(order);
 await open();
 fireEvent.click(await screen.findByRole('button',{name:'Paketi seç'}));
 await waitFor(()=>expect(apiPost).toHaveBeenCalledWith('/listings/12/feature-transfer',{package:'daily'}));
 expect(screen.getByText('350,00 TL')).toBeInTheDocument();
});
it("reports payment without claiming that the listing is already featured",async()=>{
 vi.mocked(apiGet).mockResolvedValueOnce({bank,pricing:null,items:[order]}).mockResolvedValue({bank,pricing:null,items:[{...order,status:'pending'}]});
 vi.mocked(apiPost).mockResolvedValue({...order,status:'pending'});
 await open();
 fireEvent.change(await screen.findByRole('textbox',{name:/Havaleyi gönderen ad soyad/}),{target:{value:'Test Gönderen'}});
 fireEvent.click(screen.getByRole('button',{name:'Havaleyi yaptım, bildir'}));
 expect(await screen.findByText(/Ödeme bildiriminiz alındı/)).toBeInTheDocument();
 expect(screen.queryByRole('button',{name:'Havaleyi yaptım, bildir'})).not.toBeInTheDocument();
 expect(apiPost).toHaveBeenCalledWith('/listings/feature-transfers/order-1/report',expect.objectContaining({action:'report',senderName:'Test Gönderen'}));
});
it("allows selecting a blocked listing's package but hides bank instructions",async()=>{
 const blocked={...order,paymentBlockReason:'Açıklamada test/prova etiketi var.'};
 vi.mocked(apiGet).mockResolvedValueOnce({bank,pricing:{daily:{days:1,price:350}},items:[]}).mockResolvedValue({bank,pricing:null,items:[blocked]});
 vi.mocked(apiPost).mockResolvedValue(blocked);
 const {container}=render(<ListingFeaturePanel item={{...item,status:'pending',visibilityReason:'test'}}/>);
 const details=container.querySelector('details')!;details.open=true;fireEvent(details,new Event('toggle'));
 const select=await screen.findByRole('button',{name:'Paketi seç'});expect(select).toBeEnabled();fireEvent.click(select);
 expect(await screen.findByText(/Paketiniz seçildi/)).toBeInTheDocument();
 expect(screen.queryByRole('button',{name:'Havaleyi yaptım, bildir'})).toBeNull();
 expect(screen.queryByRole('button',{name:'IBAN kopyala'})).toBeNull();
});
