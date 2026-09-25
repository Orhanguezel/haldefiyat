type ApprovalPreview = {
  subject?: string;
  html?: string;
  text?: string;
};

export function readApprovalMessageSnapshot(value: unknown): {
  preview: ApprovalPreview | null;
  logoUrl: string | null;
} {
  if (typeof value !== "string" || !value) return { preview: null, logoUrl: null };
  try {
    const snapshot = JSON.parse(value);
    return {
      preview: snapshot?.preview ?? null,
      logoUrl: typeof snapshot?.branding?.logoUrl === "string" ? snapshot.branding.logoUrl : null,
    };
  } catch {
    return { preview: null, logoUrl: null };
  }
}

export function renderBrowserMessageHtml(html: string | null, logoUrl: string | null): string | null {
  if (!html || !logoUrl) return html;
  const safeLogoUrl = logoUrl
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
  return html.replace(
    /src=(["'])cid:haldefiyat-logo@haldefiyat\.com\1/gi,
    `src="${safeLogoUrl}"`,
  );
}
