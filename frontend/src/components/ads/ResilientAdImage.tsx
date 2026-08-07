"use client";

import { useState, type CSSProperties } from "react";

export default function ResilientAdImage({
  src,
  alt,
  className,
  style,
  fallbackClassName = "",
  hideOnError = false,
}: {
  src: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
  fallbackClassName?: string;
  hideOnError?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  if (failed && hideOnError) return null;
  if (failed) {
    return (
      <span
        role="img"
        aria-label={alt || "Reklam görseli yüklenemedi"}
        className={`${className ?? ""} ${fallbackClassName} flex items-center justify-center bg-black/15 text-center text-[10px] font-semibold uppercase tracking-wider text-current/55`.trim()}
      >
        Görsel kullanılamıyor
      </span>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} style={style} loading="lazy" decoding="async" onError={() => setFailed(true)} />;
}
