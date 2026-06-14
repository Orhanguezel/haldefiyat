"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { sanitizeCmsHtml } from "@/lib/sanitize-html";

type PopupType = "topbar" | "sidebar_top" | "sidebar_center" | "sidebar_bottom";
type DisplayFrequency = "always" | "once" | "daily";

type PublicPopup = {
  id: number;
  type: PopupType;
  title: string;
  content: string | null;
  image: string | null;
  alt: string | null;
  background_color: string | null;
  text_color: string | null;
  button_text: string | null;
  button_color: string | null;
  button_hover_color: string | null;
  button_text_color: string | null;
  link_url: string | null;
  link_target: "_self" | "_blank" | string;
  text_behavior: "static" | "marquee" | string;
  closeable: boolean;
  delay_seconds: number;
  display_frequency: DisplayFrequency | string;
  order: number;
};

type Props = {
  locale: string;
};

const API_BASE = (() => {
  const override = process.env.NEXT_PUBLIC_API_URL?.trim() ?? "";
  if (typeof window !== "undefined") {
    const bakedLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)/i.test(override);
    return (override && !bakedLocalhost ? override : window.location.origin).replace(/\/$/, "");
  }
  return (override || "http://localhost:8088").replace(/\/$/, "");
})();

function stripLocalePrefix(pathname: string, locale: string): string {
  const normalized = pathname || "/";
  const prefix = `/${locale}`;
  if (normalized === prefix) return "/";
  if (normalized.startsWith(`${prefix}/`)) return normalized.slice(prefix.length) || "/";
  return normalized;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function storageKey(popup: PublicPopup): string {
  return `hal-popup:${popup.id}`;
}

function isDismissed(popup: PublicPopup): boolean {
  if (typeof window === "undefined") return false;
  const key = storageKey(popup);
  const frequency = popup.display_frequency;
  if (frequency === "once") return window.localStorage.getItem(key) === "closed";
  if (frequency === "daily") return window.localStorage.getItem(key) === todayKey();
  return window.sessionStorage.getItem(key) === "closed";
}

function markDismissed(popup: PublicPopup): void {
  if (typeof window === "undefined") return;
  const key = storageKey(popup);
  const frequency = popup.display_frequency;
  if (frequency === "once") window.localStorage.setItem(key, "closed");
  else if (frequency === "daily") window.localStorage.setItem(key, todayKey());
  else window.sessionStorage.setItem(key, "closed");
}

function sanitizeColor(value: string | null | undefined): string | undefined {
  const raw = String(value ?? "").trim();
  if (!raw) return undefined;
  if (/^#[0-9a-f]{3,8}$/i.test(raw)) return raw;
  if (/^(rgb|rgba|hsl|hsla)\([\d\s,.%/-]+\)$/i.test(raw)) return raw;
  return undefined;
}

function PopupBody({ popup }: { popup: PublicPopup }) {
  const content = popup.content ? sanitizeCmsHtml(popup.content) : "";
  const buttonStyle = {
    backgroundColor: sanitizeColor(popup.button_color),
    color: sanitizeColor(popup.button_text_color),
  };

  const body = (
    <>
      {popup.image ? (
        <div className="relative h-28 w-full overflow-hidden rounded-md bg-(--color-bg-alt)">
          <Image src={popup.image} alt={popup.alt || popup.title} fill className="object-cover" unoptimized />
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-snug">{popup.title}</p>
        {content ? (
          <div
            className="mt-1 text-sm leading-relaxed opacity-85 [&_a]:underline"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ) : null}
      </div>
      {popup.button_text && popup.link_url ? (
        <span
          className="inline-flex h-9 shrink-0 items-center justify-center rounded-md bg-(--color-brand) px-3 text-sm font-semibold text-(--color-brand-fg)"
          style={buttonStyle}
        >
          {popup.button_text}
        </span>
      ) : null}
    </>
  );

  if (!popup.link_url) return <div className="contents">{body}</div>;

  const external = popup.link_target === "_blank";
  return (
    <Link
      href={popup.link_url}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="contents"
    >
      {body}
    </Link>
  );
}

function PopupCloseButton({ popup, onClose }: { popup: PublicPopup; onClose: () => void }) {
  if (!popup.closeable) return null;
  return (
    <button
      type="button"
      onClick={onClose}
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-current/70 transition hover:bg-black/10 hover:text-current"
      aria-label="Popup kapat"
    >
      <X className="h-4 w-4" aria-hidden />
    </button>
  );
}

function TopbarPopup({ popup, onClose }: { popup: PublicPopup; onClose: () => void }) {
  return (
    <div
      className="relative z-40 border-b border-black/10 px-4 py-2 text-sm shadow-sm"
      style={{
        backgroundColor: sanitizeColor(popup.background_color) ?? "var(--brand)",
        color: sanitizeColor(popup.text_color) ?? "var(--brand-fg)",
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3 overflow-hidden">
        <div className={popup.text_behavior === "marquee" ? "min-w-0 flex-1 truncate" : "min-w-0 flex-1"}>
          <div className="flex items-center gap-3">
            <PopupBody popup={popup} />
          </div>
        </div>
        <PopupCloseButton popup={popup} onClose={onClose} />
      </div>
    </div>
  );
}

function SidebarPopup({ popup, onClose }: { popup: PublicPopup; onClose: () => void }) {
  const verticalClass =
    popup.type === "sidebar_top"
      ? "md:top-32"
      : popup.type === "sidebar_center"
        ? "md:top-1/2 md:-translate-y-1/2"
        : "md:bottom-8";

  return (
    <aside
      className={`fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-3 z-40 w-[min(22rem,calc(100vw-1.5rem))] rounded-lg border border-(--color-border-soft) bg-(--color-surface) p-3 text-(--color-foreground) shadow-2xl md:bottom-auto md:right-5 ${verticalClass}`}
      style={{
        backgroundColor: sanitizeColor(popup.background_color) ?? undefined,
        color: sanitizeColor(popup.text_color) ?? undefined,
      }}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <PopupBody popup={popup} />
        </div>
        <PopupCloseButton popup={popup} onClose={onClose} />
      </div>
    </aside>
  );
}

export default function PublicPopups({ locale }: Props) {
  const pathname = usePathname();
  const currentPath = useMemo(() => stripLocalePrefix(pathname || "/", locale), [locale, pathname]);
  const [items, setItems] = useState<PublicPopup[]>([]);

  useEffect(() => {
    const ctrl = new AbortController();
    const params = new URLSearchParams({
      locale,
      default_locale: "tr",
      current_path: currentPath,
      limit: "20",
      sort: "display_order",
      order: "asc",
    });

    fetch(`${API_BASE}/api/v1/popups?${params.toString()}`, {
      signal: ctrl.signal,
      credentials: "include",
      headers: { Accept: "application/json" },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!Array.isArray(data)) return;
        setItems(data.filter((item: PublicPopup) => !isDismissed(item)));
      })
      .catch((err) => {
        if (err?.name !== "AbortError") setItems([]);
      });

    return () => ctrl.abort();
  }, [currentPath, locale]);

  const close = (popup: PublicPopup) => {
    markDismissed(popup);
    setItems((prev) => prev.filter((item) => item.id !== popup.id));
  };

  const topbar = items.find((item) => item.type === "topbar");
  const sidebar = items.filter((item) => item.type !== "topbar").slice(0, 3);

  return (
    <>
      {topbar ? <TopbarPopup popup={topbar} onClose={() => close(topbar)} /> : null}
      {sidebar.map((popup) => (
        <SidebarPopup key={popup.id} popup={popup} onClose={() => close(popup)} />
      ))}
    </>
  );
}
