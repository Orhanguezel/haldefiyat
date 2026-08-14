"use client";

import { useState } from "react";

export default function CopyCodeBlock({ code, label = "Kod örneği" }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="overflow-hidden rounded-[8px] border border-(--color-border) bg-(--color-surface)">
      <div className="flex items-center justify-between gap-3 border-b border-(--color-border-soft) px-4 py-2">
        <span className="font-(family-name:--font-mono) text-[11px] font-semibold text-(--color-muted)">{label}</span>
        <button type="button" onClick={copy} className="min-h-9 rounded-[6px] border border-(--color-border) px-3 text-xs font-semibold text-(--color-foreground)">
          {copied ? "Kopyalandı" : "Kopyala"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-xs leading-6 text-(--color-foreground)"><code>{code}</code></pre>
    </div>
  );
}
