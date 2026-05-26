import Script from "next/script";

interface AnalyticsProps {
  ga4Id?: string | null;
  gtmId?: string | null;
  adsConversionId?: string | null;
}

export function GoogleAnalytics({ ga4Id }: { ga4Id: string }) {
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga4Id}');`}
      </Script>
    </>
  );
}

export function GoogleTagManager({ gtmId }: { gtmId: string }) {
  return (
    <Script id="gtm-init" strategy="afterInteractive">
      {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`}
    </Script>
  );
}

export function GoogleAdsConversion({ id }: { id: string }) {
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="google-ads-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}');`}
      </Script>
    </>
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
      {gtmId ? <GoogleTagManager gtmId={gtmId} /> : ga4Id ? <GoogleAnalytics ga4Id={ga4Id} /> : null}
      {adsConversionId ? <GoogleAdsConversion id={adsConversionId} /> : null}
    </>
  );
}
