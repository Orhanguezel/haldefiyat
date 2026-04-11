// src/modules/blog/rss-parse.ts — RSS 2.0 minimal parser (MVP)

export type RssParsedItem = {
  title: string;
  link: string;
  html: string;
  excerpt: string;
  pubDate: Date | null;
  author: string | null;
  imageUrl: string | null;
};

function stripCdata(raw: string): string {
  const t = raw.trim();
  if (t.startsWith('<![CDATA[')) {
    return t.slice(9).replace(/\]\]>\s*$/i, '').trim();
  }
  return t
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function extractTagInner(block: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = block.match(re);
  return m ? stripCdata(m[1]) : '';
}

function extractContentEncoded(block: string): string {
  const m = block.match(/<content:encoded[^>]*>([\s\S]*?)<\/content:encoded>/i);
  return m ? stripCdata(m[1]) : '';
}

function extractDcCreator(block: string): string {
  const m = block.match(/<dc:creator[^>]*>([\s\S]*?)<\/dc:creator>/i);
  return m ? stripCdata(m[1]) : '';
}

function roughStripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function roughSanitize(html: string): string {
  return html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/\son\w+\s*=/gi, ' data-removed=');
}

function firstImgSrc(html: string): string | null {
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m?.[1]?.trim() || null;
}

function looksLikeHttpUrl(s: string): boolean {
  return /^https?:\/\//i.test(s.trim());
}

/** RSS 2.0 XML icinden <item> listesi */
export function parseRss2Items(xml: string): RssParsedItem[] {
  const out: RssParsedItem[] = [];
  const itemRe = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(xml)) !== null) {
    const block = m[1];
    const title = extractTagInner(block, 'title') || 'Basliksiz';
    let link = extractTagInner(block, 'link').trim();
    const guid = extractTagInner(block, 'guid').trim();
    if (!link && looksLikeHttpUrl(guid)) link = guid;
    if (!link) continue;

    const encoded = extractContentEncoded(block);
    const description = extractTagInner(block, 'description');
    const rawHtml = encoded || description || `<p>${roughStripHtml(description)}</p>`;
    const html = roughSanitize(rawHtml);
    const plain = roughStripHtml(html);
    const excerpt = plain.length > 500 ? `${plain.slice(0, 497)}...` : plain;

    const pubRaw = extractTagInner(block, 'pubDate');
    const pubDate = pubRaw ? new Date(pubRaw) : null;
    const author =
      extractTagInner(block, 'author') || extractDcCreator(block) || null;

    out.push({
      title: title.slice(0, 255),
      link,
      html,
      excerpt,
      pubDate: pubDate && !Number.isNaN(pubDate.getTime()) ? pubDate : null,
      author: author ? author.slice(0, 128) : null,
      imageUrl: firstImgSrc(html),
    });
  }
  return out;
}
