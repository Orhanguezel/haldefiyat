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
      shape: "pill",
      text: mode === "login" ? "signin_with" : "signup_with",
      width: 340,
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
                <div
                  ref={googleButtonRef}
                  className={googleLoading ? "pointer-events-none opacity-70" : ""}
                />
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
