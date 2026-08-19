"use client";

import type { RefObject } from "react";
import { Mic } from "lucide-react";

interface SearchModalHeaderProps {
  query: string;
  onQueryChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  inputRef: RefObject<HTMLInputElement | null>;
  loading: boolean;
  onClose: () => void;
  voiceSupported?: boolean;
  listening?: boolean;
  onVoiceToggle?: () => void;
}

export default function SearchModalHeader({
  query,
  onQueryChange,
  onKeyDown,
  inputRef,
  loading,
  onClose,
  voiceSupported = false,
  listening = false,
  onVoiceToggle,
}: SearchModalHeaderProps) {
  return (
    <div className="flex items-center gap-3 border-b border-(--color-border) px-4 py-3">
      <svg
        width="18"
        height="18"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="shrink-0 text-(--color-muted)"
        aria-hidden
      >
        <circle cx="9" cy="9" r="6" />
        <path d="m17 17-3.5-3.5" strokeLinecap="round" />
      </svg>
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Ürün veya hal ara..."
        aria-label="Arama"
        className="flex-1 rounded-md bg-transparent px-1 py-1 text-base text-(--color-foreground) placeholder:text-(--color-muted) focus:outline-none focus:ring-2 focus:ring-(--color-brand)/40"
      />
      {loading ? (
        <div
          className="h-4 w-4 animate-spin rounded-full border-2 border-(--color-brand) border-t-transparent"
          aria-hidden
        />
      ) : null}
      {voiceSupported && onVoiceToggle ? (
        <button
          type="button"
          onClick={onVoiceToggle}
          aria-label={listening ? "Sesli aramayı durdur" : "Sesli arama"}
          title="Sesli arama"
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
            listening
              ? "animate-pulse bg-red-500 text-white"
              : "text-(--color-muted) hover:bg-(--color-bg-alt) hover:text-(--color-foreground)"
          }`}
        >
          <Mic className="h-4 w-4" />
        </button>
      ) : null}
      <button
        type="button"
        onClick={onClose}
        aria-label="Kapat"
        className="ml-1 flex h-7 w-7 items-center justify-center rounded-md text-(--color-muted) hover:bg-(--color-bg-alt) hover:text-(--color-foreground)"
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
