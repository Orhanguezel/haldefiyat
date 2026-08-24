// Alan adi koda gomulmez (marka kurali): dagitim ortaminin .env'inden gelir.
// Notr yedek yok — env eksikse link uretilmez, yanlis siteye yonlendirmektense
// hic yonlendirme yapilmaz.
const RAW = process.env.NEXT_PUBLIC_WEBSITE_URL ?? "";

export const PUBLIC_SITE_URL = RAW.replace(/\/+$/, "");

export function publicSiteLink(path: string): string | null {
  if (!PUBLIC_SITE_URL) return null;
  return `${PUBLIC_SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
