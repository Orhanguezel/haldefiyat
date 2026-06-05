"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  fetchGoogleAuthConfig,
  isApiError,
  loginWithEmail,
  signupWithEmail,
} from "@/lib/auth";
import { localePath } from "@/lib/locale-path";

const ERROR_LABELS: Record<string, string> = {
  user_exists: "Bu e-posta ile zaten bir hesap var.",
  invalid_credentials: "E-posta veya parola hatalı.",
  invalid_email: "Geçerli bir e-posta adresi girin.",
  weak_password: "Parola en az 6 karakter olmalı.",
  invalid_google_token: "Google oturumu doğrulanamadı.",
  google_oauth_not_configured: "Google ile giriş şu anda yapılandırılmadı.",
  google_email_missing: "Google hesabından e-posta bilgisi alınamadı.",
  google_email_not_verified: "Google hesabının e-posta doğrulaması gerekli.",
  google_denied: "Google ile giriş iptal edildi.",
  google_state_mismatch: "Oturum doğrulaması başarısız. Lütfen tekrar deneyin.",
  google_no_code: "Google yanıtı eksik. Lütfen tekrar deneyin.",
  google: "Google ile giriş tamamlanamadı. Lütfen tekrar deneyin.",
  request_failed: "İşlem tamamlanamadı. Lütfen tekrar deneyin.",
  invalid_body: "Form alanlarını kontrol edin.",
};

type AuthPanelProps = {
  locale: string;
  mode: "login" | "register";
};

function resolveErrorMessage(error: unknown) {
  if (isApiError(error)) {
    return ERROR_LABELS[error.code] ?? ERROR_LABELS.request_failed;
  }
  return error instanceof Error ? error.message : ERROR_LABELS.request_failed;
}

/** API origin'i (nginx /api -> backend). api-client ile ayni mantik. */
function resolveApiOrigin(): string {
  const override = process.env.NEXT_PUBLIC_API_URL?.trim() ?? "";
  if (typeof window !== "undefined") {
    const isLocalhostBaked = /^https?:\/\/(localhost|127\.0\.0\.1)/i.test(override);
    if (override && !isLocalhostBaked) return override.replace(/\/$/, "");
    return window.location.origin;
  }
  return override.replace(/\/$/, "");
}

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

export function AuthPanel({ locale, mode }: AuthPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [signupRole, setSignupRole] = useState<"customer" | "komisyoncu">("customer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const nextParam = searchParams.get("next");
  const safeNext = nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";

  // Redirect-login sonrasi backend ?error=... ile geri dondurebilir.
  useEffect(() => {
    const errorCode = searchParams.get("error");
    if (errorCode) {
      setError(ERROR_LABELS[errorCode] ?? ERROR_LABELS.request_failed);
    }
  }, [searchParams]);

  useEffect(() => {
    let active = true;
    void fetchGoogleAuthConfig()
      .then((response) => {
        if (active) setGoogleEnabled(Boolean(response.enabled && response.client_id));
      })
      .catch(() => {
        if (active) setGoogleEnabled(false);
      });
    return () => {
      active = false;
    };
  }, []);

  function startGoogleRedirect() {
    setGoogleLoading(true);
    const url = `${resolveApiOrigin()}/api/v1/auth/google/start?next=${encodeURIComponent(safeNext)}`;
    window.location.href = url;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormLoading(true);
    setError("");

    try {
      if (mode === "login") {
        await loginWithEmail({ email, password });
      } else {
        await signupWithEmail({
          email,
          password,
          fullName,
          phone,
          role: signupRole,
        });
      }
      router.push(localePath(locale, safeNext));
      router.refresh();
    } catch (err) {
      setError(resolveErrorMessage(err));
    } finally {
      setFormLoading(false);
    }
  }

  const title = mode === "login" ? "Hesabınıza giriş yapın" : "Ücretsiz hesap oluşturun";
  const subtitle = mode === "login"
    ? "Favoriler, fiyat alarmı ve bildirimleri tek hesapta yönetin."
    : "Fiyat alarmı, favoriler ve bildirimler için birkaç adımda hesabınızı oluşturun.";
  const submitLabel = mode === "login" ? "Giriş Yap" : "Kayıt Ol";
  const alternateHref = mode === "login" ? "/kayit" : "/giris";
  const alternateLabel = mode === "login" ? "Hesabın yok mu? Kayıt ol" : "Zaten hesabın var mı? Giriş yap";

  return (
    <main className="relative z-10 mx-auto flex min-h-[70vh] max-w-5xl items-center px-4 py-14 sm:px-6 lg:px-8">
      <div className="grid w-full overflow-hidden rounded-[32px] border border-(--color-border) bg-(--color-surface)/95 shadow-[0_32px_80px_rgba(6,18,10,0.18)] backdrop-blur xl:grid-cols-[1.1fr_0.9fr]">
        <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(132,240,76,0.24),transparent_42%),linear-gradient(160deg,rgba(12,26,16,0.94),rgba(18,40,22,0.92))] px-8 py-10 text-white sm:px-10 lg:px-12">
          <div className="absolute inset-y-0 right-0 w-px bg-white/10" />
          <span className="inline-flex rounded-full border border-white/15 bg-white/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">
            HaldeFiyat Hesabı
          </span>
          <h1 className="mt-5 max-w-md font-(family-name:--font-display) text-3xl font-bold leading-tight sm:text-4xl">
            {title}
          </h1>
          <p className="mt-4 max-w-md text-sm leading-7 text-white/74">
            {subtitle}
          </p>

          <div className="mt-10 grid gap-4">
            <div className="rounded-2xl border border-white/12 bg-white/7 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-white/55">Avantajlar</p>
              <p className="mt-2 text-sm text-white/84">
                Favori ürünlerini senkronize et, fiyat alarmı kur, Google ile tek tıkla giriş yap.
              </p>
            </div>
            <div className="rounded-2xl border border-white/12 bg-white/7 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-white/55">Bildirim</p>
              <p className="mt-2 text-sm text-white/84">
                OneSignal entegrasyonu aktif olduğunda tarayıcı bildirimleri hesabına otomatik bağlanır.
              </p>
            </div>
          </div>
        </section>

        <section className="px-6 py-8 sm:px-8 sm:py-10 lg:px-10">
          {error ? (
            <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {mode === "register" ? (
              <>
                <Input
                  label="Ad Soyad"
                  placeholder="Ör. Ahmet Yılmaz"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  autoComplete="name"
                  required
                />
                <Input
                  label="Telefon"
                  type="tel"
                  placeholder="05XX XXX XX XX"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  autoComplete="tel"
                  required
                />
                <div className="space-y-2">
                  <div className="text-[13px] font-semibold text-(--color-foreground)">Hesap tipi</div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "customer", label: "Kullanıcı" },
                      { value: "komisyoncu", label: "Komisyoncu" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setSignupRole(option.value as "customer" | "komisyoncu")}
                        className={[
                          "h-11 rounded-xl border px-3 text-[13px] font-semibold transition-colors",
                          signupRole === option.value
                            ? "border-(--color-brand) bg-(--color-brand)/10 text-(--color-brand)"
                            : "border-(--color-border) bg-(--color-bg-alt) text-(--color-foreground) hover:border-(--color-brand)/40",
                        ].join(" ")}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : null}

            <Input
              type="email"
              label="E-posta"
              placeholder="ornek@eposta.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />

            <Input
              type="password"
              label="Parola"
              placeholder="En az 6 karakter"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
              hint={mode === "register" ? "Hesabın oluşturulması için koşulları kabul etmiş sayılırsın." : undefined}
            />

            <Button type="submit" className="w-full justify-center" loading={formLoading}>
              {submitLabel}
            </Button>
          </form>

          {googleEnabled ? (
            <>
              <div className="my-6 flex items-center gap-3">
                <span className="h-px flex-1 bg-(--color-border)" />
                <span className="text-xs font-medium uppercase tracking-[0.18em] text-(--color-muted)">
                  veya
                </span>
                <span className="h-px flex-1 bg-(--color-border)" />
              </div>

              <button
                type="button"
                onClick={startGoogleRedirect}
                disabled={googleLoading}
                className={
                  "flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-(--color-border) bg-white px-4 text-[14px] font-semibold text-[#1f2328] shadow-sm transition-all dark:border-white/10 dark:bg-white/95 " +
                  (googleLoading
                    ? "cursor-wait opacity-70"
                    : "hover:border-(--color-brand)/50 hover:shadow-md active:scale-[0.99]")
                }
              >
                <span className="grid h-6 w-6 place-items-center rounded-full bg-white">
                  <GoogleLogo />
                </span>
                <span>
                  {googleLoading
                    ? "Google'a yönlendiriliyor…"
                    : mode === "login"
                      ? "Google ile devam et"
                      : "Google ile kaydol"}
                </span>
              </button>
            </>
          ) : null}

          <p className="mt-6 text-center text-sm text-(--color-muted)">
            <Link href={localePath(locale, alternateHref)} className="font-semibold text-(--color-brand)">
              {alternateLabel}
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
