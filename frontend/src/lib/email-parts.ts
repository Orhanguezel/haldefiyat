/**
 * E-posta adresini kullanici/alan parcalarina boler. Sunucu bilesenlerinden
 * cagrilir; "use client" modulunde duramaz (sunucu istemci fonksiyonunu cagiramaz).
 */
export function splitEmail(email: string): { user: string; domain: string } {
  const at = email.indexOf("@");
  return at > 0 ? { user: email.slice(0, at), domain: email.slice(at + 1) } : { user: email, domain: "" };
}
