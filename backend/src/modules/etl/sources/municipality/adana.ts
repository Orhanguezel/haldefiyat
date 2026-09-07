/** Official Adana bulletin: date comes from the document, never the request. */
const clean = (s: string) => s.replace(/<[^>]*>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
export function parseAdanaBulletin(html: string) {
  const heading = [...html.matchAll(/<h4\b[^>]*>([\s\S]*?)<\/h4>/gi)].map(m => clean(m[1]!)).find(s => /Günlük Raiç/i.test(s));
  const date = heading?.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!date) throw new Error('Adana bulletin date missing');
  const recordedDate = `${date[3]}-${date[2]}-${date[1]}`;
  if (new Date(`${recordedDate}T12:00:00Z`).toISOString().slice(0, 10) !== recordedDate) throw new Error('Invalid Adana date');
  const rows = [];
  const tables = [...html.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/gi)];
  for (const [index, table] of tables.entries()) {
    for (const row of table[1]!.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
      const cells = [...row[1]!.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(m => clean(m[1]!));
      if (cells.length !== 4) continue;
      const [name, rawUnit, lo, hi] = cells;
      // Municipality uses decimal points; do not apply Turkish thousands stripping.
      if (!/^\d+(?:\.\d+)?$/.test(lo!) || !/^\d+(?:\.\d+)?$/.test(hi!)) continue;
      const min = Number(lo), max = Number(hi);
      if (min <= 0 || max < min) continue; // 0/0 means no quote, not free produce.
      const unit = /^(kg|kğ)$/i.test(rawUnit!) ? 'kg' : /^adet$/i.test(rawUnit!) ? 'adet' : null;
      if (!unit) continue;
      rows.push({ name: name!, category: index === 0 ? 'sebze' : 'meyve', unit, min, max, avg: null, recordedDate });
    }
  }
  if (!rows.length) throw new Error('Adana bulletin has no valid prices');
  return rows;
}
export function adanaBulletinLinks(html: string, baseUrl: string) {
  return [...new Set([...html.matchAll(/href=["']([^"']*\/tr\/hal-detay\/\d+)["']/gi)].map(m => new URL(m[1]!, baseUrl).href))]
    .filter(u => new URL(u).origin === new URL(baseUrl).origin);
}
export async function fetchAdanaBulletin(baseUrl: string, endpoint: string, date: string, backfill: boolean) {
  const get = async (url: string) => {
    const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!res.ok) throw new Error(`Adana HTTP ${res.status}`);
    return res.text();
  };
  if (/\/hal-detay\/\d+$/.test(endpoint)) return parseAdanaBulletin(await get(baseUrl + endpoint));
  // The list is newest first. Daily jobs need only the latest published bulletin.
  const html = await get(baseUrl + endpoint);
  const links = adanaBulletinLinks(html, baseUrl);
  for (const url of links) {
    const rows = parseAdanaBulletin(await get(url));
    if (rows[0]!.recordedDate > date) continue;
    if (backfill && rows[0]!.recordedDate !== date) throw new Error('Use a dated Adana detail URL for backfill');
    return rows;
  }
  throw new Error('Adana requested bulletin not found');
}
