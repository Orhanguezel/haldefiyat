"use client";

import { useEffect, useState } from "react";

/**
 * Sunucu ciktisinda adres "kullanici [at] alan" olarak yazilir; tarayicida gercek
 * mailto baglantisina donusur. Ham HTML'i tarayan spam botlari adresi toplayamaz,
 * ziyaretci icin davranis degismez. Adres iki parca prop olarak gelir ki RSC
 * yukunde de bitisik "a@b" dizisi bulunmasin; bolme sunucu tarafinda yapilir.
 */
export function splitEmail(email: string): { user: string; domain: string } {
  const at = email.indexOf("@");
  return at > 0 ? { user: email.slice(0, at), domain: email.slice(at + 1) } : { user: email, domain: "" };
}

export default function ObfuscatedEmail({ user, domain, subject, className }: {
  user: string;
  domain: string;
  subject?: string;
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const email = `${user}@${domain}`;
  if (!user || !domain) return <span className={className}>{email}</span>;
  if (!mounted) {
    return <span className={className} data-email-user={user} data-email-domain={domain}>{user} [at] {domain}</span>;
  }
  const href = `mailto:${email}${subject ? `?subject=${encodeURIComponent(subject)}` : ""}`;
  return <a className={className} href={href}>{email}</a>;
}
