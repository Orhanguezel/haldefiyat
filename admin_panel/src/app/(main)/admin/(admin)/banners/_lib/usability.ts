/** Calendar dates must not shift when the browser is ahead of UTC. */
export function monthPeriod(month: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error("Geçersiz ay");
  const [year, value] = month.split("-").map(Number);
  const days = new Date(Date.UTC(year!, value!, 0)).getUTCDate();
  return { from: `${month}-01`, to: `${month}-${days}` };
}
export function monthKey(offset = 0, now = new Date()) {
  const date = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
export function packageSlug(name: string) {
  return name
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ç/g, "c")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 96)
    .replace(/-+$/g, "");
}
