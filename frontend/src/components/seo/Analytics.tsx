import Script from "next/script";

interface AnalyticsProps {
  ga4Id?: string | null;
  gtmId?: string | null;
  adsConversionId?: string | null;
}

export function GoogleAnalytics({ ga4Id }: { ga4Id: string }) {
  return (
    <DeferredGoogleTags ga4Id={ga4Id} />
  );
}

export function GoogleConsentMode() {
  return (
    <Script id="google-consent-mode" strategy="beforeInteractive">
      {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}try{var c=localStorage.getItem('hf_cookie_consent');var v=c==='accepted'?'granted':'denied';gtag('consent','default',{ad_storage:v,analytics_storage:v,ad_user_data:v,ad_personalization:v,wait_for_update:500});}catch(e){gtag('consent','default',{ad_storage:'denied',analytics_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',wait_for_update:500});}`}
    </Script>
  );
}

export function GoogleTagManager({ gtmId }: { gtmId: string }) {
  return <DeferredGoogleTags gtmId={gtmId} />;
}

export function GoogleAdsConversion({ id }: { id: string }) {
  return <DeferredGoogleTags adsConversionId={id} />;
}

function DeferredGoogleTags({
  ga4Id,
  gtmId,
  adsConversionId,
}: AnalyticsProps) {
  const config = JSON.stringify({ ga4Id, gtmId, adsConversionId });
  return (
    <Script id="google-tags-deferred-loader" strategy="afterInteractive">
      {`(function(c){var loaded=false,timer;function add(src){var s=document.createElement('script');s.async=true;s.src=src;document.head.appendChild(s)}function load(){if(loaded)return;loaded=true;clearTimeout(timer);['pointerdown','keydown','touchstart','scroll'].forEach(function(e){removeEventListener(e,load)});window.dataLayer=window.dataLayer||[];window.gtag=window.gtag||function(){dataLayer.push(arguments)};if(c.gtmId){dataLayer.push({'gtm.start':Date.now(),event:'gtm.js'});add('https://www.googletagmanager.com/gtm.js?id='+encodeURIComponent(c.gtmId))}else if(c.ga4Id){gtag('js',new Date());gtag('config',c.ga4Id);add('https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(c.ga4Id))}if(c.adsConversionId){gtag('js',new Date());gtag('config',c.adsConversionId,{allow_enhanced_conversions:true});if(!c.gtmId&&c.adsConversionId!==c.ga4Id)add('https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(c.adsConversionId))}}['pointerdown','keydown','touchstart','scroll'].forEach(function(e){addEventListener(e,load,{once:true,passive:true})});function idle(){if('requestIdleCallback'in window){requestIdleCallback(load,{timeout:2500})}else{timer=setTimeout(load,2500)}}if(document.readyState==='complete')idle();else addEventListener('load',idle,{once:true})})(${config});`}
    </Script>
  );
}

export function GtmNoscript({ gtmId }: { gtmId: string }) {
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
      />
    </noscript>
  );
}

export default function Analytics({ ga4Id, gtmId, adsConversionId }: AnalyticsProps) {
  if (!ga4Id && !gtmId && !adsConversionId) return null;

  return (
    <>
      <GoogleConsentMode />
      <DeferredGoogleTags
        ga4Id={gtmId ? null : ga4Id}
        gtmId={gtmId}
        adsConversionId={adsConversionId}
      />
    </>
  );
}
