import { getSonMakaleler } from "@/lib/analiz";
import { fetchAutoWeeklyReports } from "@/lib/api";
import { isRecentNewsDate } from "@/lib/news-sitemap";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://haldefiyat.com").replace(/\/$/, "");

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const reports = await fetchAutoWeeklyReports(20);
  const articles = [...reports, ...getSonMakaleler(20)]
    .filter((article, index, list) => list.findIndex((item) => item.slug === article.slug) === index)
    .filter((article) => isRecentNewsDate(article.tarih))
    .slice(0, 100);

  const items = articles.map((article) => `
  <url>
    <loc>${SITE_URL}/analiz/${escapeXml(article.slug)}</loc>
    <news:news>
      <news:publication>
        <news:name>HalDeFiyat</news:name>
        <news:language>tr</news:language>
      </news:publication>
      <news:publication_date>${escapeXml(article.tarih)}</news:publication_date>
      <news:title>${escapeXml(article.baslik)}</news:title>
    </news:news>
  </url>`).join("");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">${items}
</urlset>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=900, s-maxage=900",
    },
  });
}
