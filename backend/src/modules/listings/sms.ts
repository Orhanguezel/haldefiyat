import { env } from "@/core/env";

export type SmsResult = { ok: true; provider: string } | { ok: false; provider: string; error: string };

// TR + uluslararasi telefon normalize (shopo NetgsmService deseni)
function normalizePhone(raw: string): string {
  const hasPlus = raw.trim().startsWith("+");
  const digits = raw.replace(/[^0-9]/g, "");
  if (hasPlus) return digits;                       // +49172... → 49172...
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.startsWith("0")) return "90" + digits.slice(1);     // 0543... → 90543...
  if (!digits.startsWith("90") && digits.length === 10) return "90" + digits; // 543... → 90543...
  return digits;
}

async function sendViaNetgsm(phone: string, message: string): Promise<SmsResult> {
  const { usercode, password, msgheader, endpoint } = env.SMS.netgsm;
  if (!usercode || !password || !msgheader) {
    console.warn({ phone }, "[listings:sms] netgsm kredansiyel eksik — gonderim atlandi");
    return env.NODE_ENV === "production"
      ? { ok: false, provider: "netgsm", error: "missing_credentials" }
      : { ok: true, provider: "netgsm" };
  }
  const url = new URL(endpoint);
  url.search = new URLSearchParams({
    usercode, password, msgheader, gsmno: normalizePhone(phone), message,
  }).toString();
  try {
    const res = await fetch(url, { method: "GET" });
    const body = (await res.text()).trim();
    // Netgsm basari kodlari: 00/01/02 → mesaj kabul edildi
    if (["00", "01", "02"].includes(body) || body.startsWith("00")) {
      return { ok: true, provider: "netgsm" };
    }
    console.warn({ phone, body, status: res.status }, "[listings:sms] netgsm hata yaniti");
    return { ok: false, provider: "netgsm", error: `netgsm_${body || res.status}` };
  } catch (err) {
    console.error({ phone, err }, "[listings:sms] netgsm istisna");
    return { ok: false, provider: "netgsm", error: "netgsm_exception" };
  }
}

export async function sendListingOtpSms(phone: string, code: string): Promise<SmsResult> {
  const provider = env.SMS.provider;
  const message = `HaldeFiyat dogrulama kodunuz: ${code}`;
  if (provider === "none") {
    console.info({ phone, code }, "[listings:sms] dev otp (provider=none)");
    return { ok: true, provider: "none" };
  }
  if (provider === "netgsm") return sendViaNetgsm(phone, message);
  return { ok: false, provider, error: "unsupported_provider" };
}
