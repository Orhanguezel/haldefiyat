"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  fetchGoogleAuthConfig,
  isApiError,
  loginWithEmail,
  loginWithGoogle,
  signupWithEmail,
} from "@/lib/auth";
import { localePath } from "@/lib/locale-path";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
            auto_select?: boolean;
            ux_mode?: "popup" | "redirect";
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: Record<string, string | number | boolean>,
          ) => void;
        };
      };
    };
  }
}

const ERROR_LABELS: Record<string, string> = {
  user_exists: "Bu e-posta ile zaten bir hesap var.",
  invalid_credentials: "E-posta veya parola hatalı.",
  invalid_email: "Geçerli bir e-posta adresi girin.",
  weak_password: "Parola en az 6 karakter olmalı.",
  invalid_google_token: "Google oturumu doğrulanamadı.",
  google_oauth_not_configured: "Google ile giriş şu anda yapılandırılmadı.",
  google_email_missing: "Google hesabından e-posta bilgisi alınamadı.",
  google_email_not_verified: "Google hesabının e-posta doğrulaması gerekli.",
  request_failed: "İşlem tamamlanamadı. Lütfen tekrar deneyin.",
  invalid_body: "Form alanlarını kontrol edin.",
};

type AuthPanelProps = {
  locale: string;
  mode: "login" | "register";
};

type GoogleConfigState = {
  enabled: boolean;
  clientId: string | null;
};

function resolveErrorMessage(error: unknown) {
  if (isApiError(error)) {
    return ERROR_LABELS[error.code] ?? ERROR_LABELS.request_failed;
  }
  return error instanceof Error ? error.message : ERROR_LABELS.request_failed;
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
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [googleConfig, setGoogleConfig] = useState<GoogleConfigState>({
    enabled: false,
    clientId: null,
  });
  const [googleLoading, setGoogleLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    let active = true;

    void fetchGoogleAuthConfig()
      .then((response) => {
        if (!active) return;
        setGoogleConfig({
          enabled: response.enabled,
          clientId: response.client_id,
        });
      })
      .catch(() => {
        if (!active) return;
        setGoogleConfig({ enabled: false, clientId: null });
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!scriptReady || !googleConfig.clientId || !googleButtonRef.current || !window.google) {
      return;
    }

    googleButtonRef.current.innerHTML = "";
    window.google.accounts.id.initialize({
      client_id: googleConfig.clientId,
      ux_mode: "popup",
      callback: async (response) => {
        if (!response.credential) {
          setError(ERROR_LABELS.invalid_google_token);
          return;
        }

        setGoogleLoading(true);
        setError("");
        try {
          await loginWithGoogle(response.credential);
          router.push(localePath(locale, "/"));
          router.refresh();
        } catch (err) {
          setError(resolveErrorMessage(err));
        } finally {
          setGoogleLoading(false);
        }
      },
    });
    window.google.accounts.id.renderButton(googleButtonRef.current, {
      theme: "outline",
      size: "large",
      type: "standard",
      shape: "rectangular",
      text: mode === "login" ? "signin_with" : "signup_with",
      width: 352,
      logo_alignment: "left",
    });
  }, [googleConfig.clientId, locale, mode, router, scriptReady]);

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
        });
      }
      router.push(localePath(locale, "/"));
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
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />

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
                <Input
                  label="Ad Soyad"
                  placeholder="Ör. Ahmet Yılmaz"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  autoComplete="name"
                />
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

            <div className="my-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-(--color-border)" />
              <span className="text-xs font-medium uppercase tracking-[0.18em] text-(--color-muted)">
                veya
              </span>
              <span className="h-px flex-1 bg-(--color-border)" />
            </div>

            <div className="flex min-h-11 items-center justify-center">
              {googleConfig.enabled && googleConfig.clientId ? (
                <div className="relative w-full max-w-[352px]">
                  <div
                    aria-hidden="true"
                    className={
                      "flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-(--color-border) bg-white px-4 text-[14px] font-semibold text-[#1f2328] shadow-sm transition-all dark:border-white/10 dark:bg-white/95 " +
                      (googleLoading ? "opacity-70" : "hover:border-(--color-brand)/50 hover:shadow-md active:scale-[0.99]")
                    }
                  >
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-white">
                      <GoogleLogo />
                    </span>
                    <span>{mode === "login" ? "Google ile devam et" : "Google ile kaydol"}</span>
                  </div>
                  <div
                    ref={googleButtonRef}
                    className={
                      "absolute inset-0 z-10 h-11 w-full cursor-pointer opacity-0 [&>div]:!h-11 [&>div]:!w-full [&_iframe]:!block [&_iframe]:!h-11 [&_iframe]:!w-full " +
                      (googleLoading ? "pointer-events-none" : "")
                    }
                  />
                </div>
              ) : (
                <button
                  type="button"
                  disabled
                  className="inline-flex h-11 w-full items-center justify-center rounded-full border border-(--color-border) bg-(--color-background) px-4 text-sm font-semibold text-(--color-muted)"
                >
                  Google ile giriş yapılandırılmadı
                </button>
              )}
            </div>

            <p className="mt-6 text-center text-sm text-(--color-muted)">
              <Link href={localePath(locale, alternateHref)} className="font-semibold text-(--color-brand)">
                {alternateLabel}
              </Link>
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
