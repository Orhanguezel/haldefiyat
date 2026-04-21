'use client';

// =============================================================
// FILE: src/app/(main)/admin/_components/common/admin-json-editor.tsx
// =============================================================

import React, { useEffect, useState } from 'react';
import { Braces } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  DEFAULT_JSON_EDITOR_HEIGHT,
  parseEditorJson,
  stringifyEditorJson,
  type AdminJsonEditorProps,
} from '@/integrations/shared';

export type { AdminJsonEditorProps } from '@/integrations/shared';

export const AdminJsonEditor: React.FC<AdminJsonEditorProps> = ({
  label,
  value,
  onChange,
  onErrorChange,
  disabled,
  helperText,
  height = DEFAULT_JSON_EDITOR_HEIGHT,
}) => {
  const [text, setText] = useState<string>(() => stringifyEditorJson(value));
  const [internalError, setInternalError] = useState<string | null>(null);

  useEffect(() => {
    setText(stringifyEditorJson(value));
  }, [value]);

  const handleBlur = () => {
    const parsed = parseEditorJson(text);
    if (!parsed.error) {
      onChange(parsed.value);
      setInternalError(null);
      onErrorChange?.(null);
      return;
    }

    setInternalError(parsed.error);
    onErrorChange?.(parsed.error);
  };

  const error = internalError;

  return (
    <div className="space-y-2">
      {label ? (
        <div className="flex items-center justify-between gap-2">
          <Label className="text-sm">{label}</Label>
          <Badge variant="secondary" className="gap-1">
            <Braces className="size-3.5" />
            JSON editor
          </Badge>
        </div>
      ) : null}

      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleBlur}
        disabled={disabled}
        spellCheck={false}
        className={cn(
          'font-mono text-xs leading-5',
          error && 'border-destructive focus-visible:ring-destructive',
        )}
        style={{
          minHeight: height,
          whiteSpace: 'pre',
          fontFamily:
            "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
        }}
      />

      {helperText && !error ? (
        <div className="text-xs text-muted-foreground">{helperText}</div>
      ) : null}

      {error ? (
        <div className="text-xs text-destructive">
          JSON hatası: <span className="font-medium">{error}</span>
        </div>
      ) : null}
    </div>
  );
};
