import {ownerVisibilityReason} from './evidence-policy';
export type FeatureListing = {status:string;validUntil:string|null;isFeatured:number;featuredUntil:Date|null;raw?:Record<string,unknown>|null;description?:string|null};
export function featurePaymentBlock(listing:FeatureListing,days:number,now=new Date()):string|null {
 const reason=ownerVisibilityReason({...listing,validUntil:listing.validUntil ?? ''});
 if(reason==='deleted')return 'İlan silinmiş. Yeni bir ilan oluşturun.';
 if(reason==='test')return 'Açıklamada test/prova etiketi var. Gerçek ilan bilgilerini düzenleyip yayın onayı alın; ardından havale yapabilirsiniz.';
 if(reason==='pending')return 'İlanınız yayın onayı bekliyor. Paketiniz seçildi; ilan yayına alındıktan sonra havale bilgileri açılacak.';
 if(reason==='expired'||reason==='closed')return 'İlan yayında değil. Son tarihini uzatıp yeniden yayın onayı alın; ardından havale yapabilirsiniz.';
 if(reason)return 'İlanınız yayına uygun değil. Bilgilerini düzenleyip yayın onayı alın.';
 const start=listing.isFeatured&&listing.featuredUntil&&listing.featuredUntil>now?listing.featuredUntil:now;
 const end=new Date(start.getTime()+days*86400000);
 if(!listing.validUntil||end>new Date(`${listing.validUntil}T23:59:59.999Z`))return `${days} günlük paket için ilan süresi yetersiz. Son tarihi en az ${end.toISOString().slice(0,10).split('-').reverse().join('.')} olacak şekilde uzatın. Ödeme onayı sırasında süre yeniden kontrol edilir.`;
 return null;
}
