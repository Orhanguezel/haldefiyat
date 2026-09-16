/**
 * Oturum VARLIGI isareti — icerik tasimaz, yalnizca "bu tarayicida bir oturum
 * kuruldu" der.
 *
 * NEDEN: refresh cookie'si httpOnly, JS okuyamiyor. Bu yuzden
 * `rehydrateAuthSession` her anonim ziyarette de `/auth/session/bootstrap`
 * cagiriyordu; cevap 401 gelince api-client bunu oturum istegi sayip
 * `/auth/token/refresh` ile bir kez daha deniyordu. Sonuc: her anonim sayfa
 * goruntulemesinde iki bosa istek ve iki konsol hatasi
 * (16 Eyl 2026 Lighthouse mobil: errors-in-console 0/100, tek bulgu buydu).
 *
 * Isaret localStorage'da degil COOKIE'de tutulur: localStorage temizlenmis ama
 * oturum cookie'si duran kullanicinin oturumu yine geri yuklenebilsin diye.
 */

const MARKER = "hf_has_session";
const MAX_AGE_DAYS = 30;

export function setSessionMarker(): void {
  if (typeof document === "undefined") return;
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${MARKER}=1; Path=/; Max-Age=${MAX_AGE_DAYS * 86400}; SameSite=Lax${secure}`;
}

export function clearSessionMarker(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${MARKER}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function hasSessionMarker(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split("; ").some((entry) => entry.startsWith(`${MARKER}=1`));
}
