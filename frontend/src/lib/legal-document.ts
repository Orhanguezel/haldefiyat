import { sanitizeCmsHtml } from "@/lib/sanitize-html";

export type LegalHeading = { id: string; label: string; level: 2 | 3 };

function slugifyHeading(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/[ıİ]/g, "i")
    .replace(/[şŞ]/g, "s")
    .replace(/[ğĞ]/g, "g")
    .replace(/[üÜ]/g, "u")
    .replace(/[öÖ]/g, "o")
    .replace(/[çÇ]/g, "c")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "bolum";
}

function textFromHeading(markup: string) {
  return markup
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function prepareLegalDocument(content: string): { html: string; headings: LegalHeading[] } {
  const headings: LegalHeading[] = [];
  const used = new Set<string>();
  const clean = sanitizeCmsHtml(content);
  const html = clean.replace(/<(h2|h3)([^>]*)>([\s\S]*?)<\/\1>/gi, (full, tag: "h2" | "h3", attrs: string, inner: string) => {
    const label = textFromHeading(inner);
    if (!label) return full;
    const existing = attrs.match(/\sid=["']([^"']+)["']/i)?.[1];
    const base = existing || slugifyHeading(label);
    let id = base;
    let suffix = 2;
    while (used.has(id)) id = `${base}-${suffix++}`;
    used.add(id);
    headings.push({ id, label, level: tag === "h2" ? 2 : 3 });
    const nextAttrs = existing ? attrs.replace(/\sid=["'][^"']+["']/i, ` id="${id}"`) : `${attrs} id="${id}"`;
    return `<${tag}${nextAttrs}>${inner}</${tag}>`;
  });
  return { html, headings };
}
