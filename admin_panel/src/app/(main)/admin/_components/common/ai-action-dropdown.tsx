'use client';

// =============================================================
// AIActionDropdown — AI aksiyonlari dropdown menu
// =============================================================

import type * as React from 'react';
import { FileText, Languages, Loader2, Search, Sparkles, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAdminT } from './use-admin-t';
import type { AIAction } from './use-ai-content-assist';

interface AIActionDropdownProps {
  onAction: (action: AIAction) => void;
  loading?: boolean;
  disabled?: boolean;
}

const ACTION_ICONS: Record<AIAction, React.ElementType> = {
  full: FileText,
  enhance: Wand2,
  translate: Languages,
  generate_meta: Search,
};

export function AIActionDropdown({ onAction, loading, disabled }: AIActionDropdownProps) {
  const t = useAdminT('admin.common.ai');

  const actions: { key: AIAction; label: string }[] = [
    { key: 'full', label: t('full') || 'Tam Icerik Olustur' },
    { key: 'enhance', label: t('enhance') || 'Icerigi Gelistir' },
    { key: 'translate', label: t('translate') || 'Cevir' },
    { key: 'generate_meta', label: t('generateMeta') || 'SEO Meta Olustur' },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || loading}
          className="border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100 dark:border-purple-700 dark:bg-purple-950/30 dark:text-purple-300 dark:hover:bg-purple-900/40"
        >
          {loading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1.5 h-4 w-4" />}
          {loading ? (t('working') || 'AI calisiyor...') : 'AI'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {actions.map(({ key, label }) => {
          const Icon = ACTION_ICONS[key];
          return (
            <DropdownMenuItem key={key} onClick={() => onAction(key)} disabled={loading}>
              <Icon className="mr-2 h-4 w-4 text-purple-600 dark:text-purple-400" />
              {label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
