import { fetchSiteSettings } from "@/lib/site-settings";
import { buildSecurityTxt } from "@/lib/security-txt";

export const revalidate = 300;

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://haldefiyat.com").replace(/\/$/, "");

export async function GET() {
  const settings = await fetchSiteSettings("tr");
  const body = buildSecurityTxt({
    contactEmail: settings.contact_email,
    siteUrl: SITE_URL,
  });

  if (!body) {
    return new Response("Security contact is not configured.\n", {
      status: 503,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "Retry-After": "300",
      },
    });
  }

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
