'use client';

// =============================================================
// AIResultsPanel — AI sonuclarini locale kartlari olarak gosterir
// =============================================================

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { LocaleContent } from './use-ai-content-assist';

interface AIResultsPanelProps {
  results: LocaleContent[];
  currentLocale: string;
  onApply: (lc: LocaleContent) => void;
  onClose: () => void;
}

const LOCALE_FLAGS: Record<string, string> = {
  de: '\u{1F1E9}\u{1F1EA}',
  en: '\u{1F1EC}\u{1F1E7}',
  tr: '\u{1F1F9}\u{1F1F7}',
  fr: '\u{1F1EB}\u{1F1F7}',
  ar: '\u{1F1F8}\u{1F1E6}',
  ru: '\u{1F1F7}\u{1F1FA}',
};

export function AIResultsPanel({ results, currentLocale, onApply, onClose }: AIResultsPanelProps) {
  const others = results.filter((r) => r.locale !== currentLocale);
  if (!others.length) return null;

  return (
    <div className="border-b bg-purple-50/50 p-3 dark:bg-purple-950/20">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-medium text-purple-700 text-sm dark:text-purple-300">
          AI — Diger Diller ({others.length})
        </span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {others.map((r) => (
          <div key={r.locale} className="space-y-1.5 rounded-md border bg-background p-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold font-mono text-xs uppercase">
                {LOCALE_FLAGS[r.locale] || ''} {r.locale}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-6 px-2 text-[10px] text-purple-700 dark:text-purple-300"
                onClick={() => onApply(r)}
              >
                Bu dile gec
              </Button>
            </div>
            <p className="truncate font-medium text-xs">{r.title}</p>
            {r.summary && <p className="line-clamp-2 text-[10px] text-muted-foreground">{r.summary}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
