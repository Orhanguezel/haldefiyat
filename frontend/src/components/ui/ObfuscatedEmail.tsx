"use client";

import { useEffect, useState } from "react";

/**
 * Sunucu ciktisinda adres "kullanici [at] alan" olarak yazilir; tarayicida gercek
 * mailto baglantisina donusur. Ham HTML'i tarayan spam botlari adresi toplayamaz,
 * ziyaretci icin davranis degismez.
 */
export default function ObfuscatedEmail({ email, subject, className }: {
  email: string;
  subject?: string;
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [user, domain] = email.split("@");
  if (!user || !domain) return <span className={className}>{email}</span>;
  if (!mounted) {
    return <span className={className} data-email-user={user} data-email-domain={domain}>{user} [at] {domain}</span>;
  }
  const href = `mailto:${email}${subject ? `?subject=${encodeURIComponent(subject)}` : ""}`;
  return <a className={className} href={href}>{email}</a>;
}
