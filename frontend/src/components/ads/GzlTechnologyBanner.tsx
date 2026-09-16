"use client";
import StandardBanner from "./StandardBanner";
export default function GzlTechnologyBanner({ clickHref, className = "" }: { clickHref?: string | null; className?: string; compactMobile?: boolean }) {
  return <div className={className}><StandardBanner href={clickHref || "/gzl-teknoloji#teklif"} banner={{
    id:0, position:"home_mid", format:"half", type:"image", advertiser:"GZL Teknoloji", title:"İşinizi dijitale taşıyın", caption:null,
    imageUrl:"/images/sponsors/gzl-devices.webp", alt:"GZL Teknoloji", linkUrl:"/gzl-teknoloji#teklif", linkTarget:"_self", rel:"sponsored nofollow noopener", code:null, ctaLabel:"Teklif al", device:"all",
    creativeConfig:{ logoUrl:"/images/sponsors/gzl-logo.png", backgroundColor:"#081e32", textColor:"#ffffff", accentColor:"#dfbd70", description:"Web sitesi · Özel yazılım · Otomasyon", action:"quote" },
  }} /></div>;
}
