"use client";

import { useEffect, useState } from "react";
import { ApiError, apiPost } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const ERROR_MESSAGES: Record<string, string> = {
  invalid_phone: "Geçerli bir cep telefonu numarası girin.",
  invalid_code: "Kod hatalı. Altı haneli kodu kontrol edin.",
  locked_or_expired: "Kodun süresi doldu veya deneme sınırı aşıldı. Yeni kod isteyin.",
  rate_limited: "Yeni kod için 60 saniye bekleyin.",
  daily_limit: "Bu numara için günlük doğrulama sınırına ulaşıldı.",
  sms_unavailable: "SMS doğrulama servisi şu anda kullanılamıyor.",
};

type Props = {
  phone: string;
  onVerified: (token: string | null) => void;
};

export function PhoneOtpVerification({ phone, onVerified }: Props) {
  const [code, setCode] = useState("");
  const [phase, setPhase] = useState<"idle" | "sending" | "sent" | "verifying" | "verified">("idle");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    setCode("");
    setPhase("idle");
    setMessage("");
    setError("");
    setCooldown(0);
    onVerified(null);
  }, [phone, onVerified]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  function errorMessage(caught: unknown) {
    const code = caught instanceof ApiError ? caught.code : "request_failed";
    return ERROR_MESSAGES[code] ?? "Doğrulama işlemi tamamlanamadı. Lütfen tekrar deneyin.";
  }

  async function sendCode() {
    setPhase("sending");
    setError("");
    setMessage("");
    try {
      await apiPost("/listings/otp/send", { phone });
      setPhase("sent");
      setCooldown(60);
      setMessage("Altı haneli kod gönderildi. Kod 5 dakika geçerlidir.");
    } catch (caught) {
      setPhase("idle");
      setError(errorMessage(caught));
      if (caught instanceof ApiError && caught.code === "rate_limited") setCooldown(60);
    }
  }

  async function verifyCode() {
    setPhase("verifying");
    setError("");
    try {
      const result = await apiPost<{ token: string; phone: string }>("/listings/otp/verify", { phone, code });
      onVerified(result.token);
      setPhase("verified");
      setMessage(`${result.phone} doğrulandı. Numara ilanda açık yayınlanmaz.`);
    } catch (caught) {
      setPhase("sent");
      setError(errorMessage(caught));
    }
  }

  const validPhone = phone.replace(/\D/g, "").length >= 10;
  const busy = phase === "sending" || phase === "verifying";

  return (
    <fieldset className="rounded-[8px] border border-(--color-border) bg-(--color-bg-alt) p-4 md:col-span-2" aria-describedby="phone-otp-help">
      <legend className="px-1 text-sm font-bold text-(--color-foreground)">Telefon doğrulama</legend>
      <p id="phone-otp-help" className="mt-1 text-xs leading-5 text-(--color-muted)">Doğrulama, ilan ve arama talebi güvenini artırır. Ham telefon public ilan cevabında paylaşılmaz.</p>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        {phase === "sent" || phase === "verifying" ? (
          <div className="w-48">
            <Input
              id="listing-otp-code"
              label="SMS kodu"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              disabled={busy}
            />
          </div>
        ) : null}
        {phase === "verified" ? (
          <span className="inline-flex min-h-11 items-center rounded-[7px] border border-emerald-300 bg-emerald-50 px-4 text-sm font-semibold text-emerald-800">Doğrulandı</span>
        ) : phase === "sent" || phase === "verifying" ? (
          <Button type="button" onClick={verifyCode} loading={phase === "verifying"} disabled={code.length !== 6}>Kodu doğrula</Button>
        ) : (
          <Button type="button" variant="secondary" onClick={sendCode} loading={phase === "sending"} disabled={!validPhone || cooldown > 0}>Kod gönder</Button>
        )}
        {phase !== "verified" && cooldown > 0 ? (
          <button type="button" disabled className="min-h-11 px-2 text-xs font-semibold text-(--color-muted)" aria-label={`Yeniden kod gönderme için ${cooldown} saniye bekleyin`}>
            Yeniden gönder ({cooldown} sn)
          </button>
        ) : null}
        {phase === "sent" && cooldown === 0 ? (
          <button type="button" onClick={sendCode} className="min-h-11 px-2 text-xs font-semibold text-(--color-brand)">Kodu yeniden gönder</button>
        ) : null}
      </div>
      <div className="mt-2 min-h-5 text-xs" aria-live="polite" aria-atomic="true">
        {error ? <p role="alert" className="text-(--color-danger)">{error}</p> : message ? <p role="status" className="text-(--color-muted)">{message}</p> : null}
      </div>
    </fieldset>
  );
}
