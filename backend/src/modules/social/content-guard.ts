const PHONE_RE = /(?:\+?90|0)?\s*5\d{2}(?:[\s().-]*\d){7}\b/;
const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const TEMPLATE_ARTIFACT_RE = /\b(?:undefined|null|nan|invalid date|lorem ipsum)\b/i;
const URL_RE = /https?:\/\/[^\s)]+/gi;

export function socialDraftIssues(textInput: string): string[] {
  const text = textInput.trim();
  const issues: string[] = [];
  if (!text) issues.push("empty");
  if (text.length > 280) issues.push("too_long");
  if (PHONE_RE.test(text)) issues.push("phone_pii");
  if (EMAIL_RE.test(text)) issues.push("email_pii");
  if (TEMPLATE_ARTIFACT_RE.test(text)) issues.push("template_artifact");
  for (const rawUrl of text.match(URL_RE) ?? []) {
    try {
      const hostname = new URL(rawUrl).hostname.toLowerCase();
      if (hostname !== "haldefiyat.com" && hostname !== "www.haldefiyat.com") issues.push("external_url");
    } catch {
      issues.push("invalid_url");
    }
  }
  return [...new Set(issues)];
}

export function assertSocialDraft(text: string): void {
  const issues = socialDraftIssues(text);
  if (issues.length) throw new Error(`content_guard:${issues.join(",")}`);
}
