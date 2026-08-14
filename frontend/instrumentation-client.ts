import { scrubSentryEvent } from "./sentry-privacy";

type SentryModule = typeof import("@sentry/nextjs");

const earlyErrors: unknown[] = [];
let sentryPromise: Promise<SentryModule> | null = null;

function rememberError(event: ErrorEvent) {
  earlyErrors.push(event.error ?? new Error(event.message));
}

function rememberRejection(event: PromiseRejectionEvent) {
  earlyErrors.push(event.reason);
}

if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_SENTRY_DSN) {
  window.addEventListener("error", rememberError);
  window.addEventListener("unhandledrejection", rememberRejection);
}

function initializeSentry(): Promise<SentryModule> {
  if (sentryPromise) return sentryPromise;

  sentryPromise = import("@sentry/nextjs").then((Sentry) => {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
      enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
      sendDefaultPii: false,
      beforeSend: scrubSentryEvent,
    });

    window.removeEventListener("error", rememberError);
    window.removeEventListener("unhandledrejection", rememberRejection);
    earlyErrors.splice(0).forEach((error) => Sentry.captureException(error));
    return Sentry;
  });

  return sentryPromise;
}

if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_SENTRY_DSN) {
  const start = () => void initializeSentry();
  (["pointerdown", "keydown", "touchstart"] as const).forEach((eventName) => {
    window.addEventListener(eventName, start, { once: true, passive: true });
  });
  window.setTimeout(start, 30_000);
}

export function onRouterTransitionStart(href: string, navigationType: "push" | "replace" | "traverse") {
  void initializeSentry().then((Sentry) => {
    Sentry.captureRouterTransitionStart(href, navigationType);
  });
}
