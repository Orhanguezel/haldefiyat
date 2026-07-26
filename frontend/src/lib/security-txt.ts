const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function buildSecurityTxt({
  contactEmail,
  siteUrl,
  now = new Date(),
}: {
  contactEmail: string;
  siteUrl: string;
  now?: Date;
}): string | null {
  const email = contactEmail.trim();
  if (!EMAIL.test(email)) return null;

  const base = siteUrl.replace(/\/$/, "");
  let canonical: URL;
  try {
    canonical = new URL(`${base}/.well-known/security.txt`);
  } catch {
    return null;
  }
  if (canonical.protocol !== "https:") return null;

  const expires = new Date(now);
  expires.setUTCFullYear(expires.getUTCFullYear() + 1);

  return [
    `Contact: mailto:${email}`,
    `Expires: ${expires.toISOString()}`,
    `Canonical: ${canonical.toString()}`,
    "Preferred-Languages: tr, en",
    "",
  ].join("\n");
}
