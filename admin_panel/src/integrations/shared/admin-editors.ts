import type { ReactNode } from 'react';

export type AdminJsonEditorProps = {
  label?: ReactNode;
  value: unknown;
  onChange: (next: unknown) => void;
  onErrorChange?: (err: string | null) => void;
  disabled?: boolean;
  helperText?: ReactNode;
  height?: number;
};

export type RichContentEditorProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  height?: string;
  onUploadImage?: (file: File) => Promise<string>;
};

export type RichContentEditorTab = 'visual' | 'source';

export const DEFAULT_JSON_EDITOR_HEIGHT = 260;
export const DEFAULT_RICH_EDITOR_HEIGHT = '260px';

export function stringifyEditorJson(value: unknown): string {
  try {
    return JSON.stringify(value ?? {}, null, 2);
  } catch {
    return '';
  }
}

export function parseEditorJson(
  text: string,
): { value: unknown; error: string | null } {
  const trimmed = text.trim();

  if (!trimmed) {
    return { value: {}, error: null };
  }

  try {
    return { value: JSON.parse(text), error: null };
  } catch (error) {
    const message =
      error && typeof error === 'object' && 'message' in error
        ? String((error as { message?: unknown }).message ?? '')
        : '';
    return { value: null, error: message || 'Geçersiz JSON' };
  }
}

export function normalizeLegacyRichHtml(raw: string | undefined | null): string {
  if (!raw) return '';

  const trimmed = raw.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed) as { html?: unknown };
      if (typeof parsed.html === 'string') return parsed.html;
    } catch {
      // ignore
    }
  }

  return raw;
}

export function insertHtmlIntoCurrentSelection(html: string): void {
  if (typeof window === 'undefined') return;

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  range.deleteContents();

  const temp = document.createElement('div');
  temp.innerHTML = html;

  const fragment = document.createDocumentFragment();
  let lastNode: ChildNode | null = null;

  while (temp.firstChild) {
    lastNode = temp.firstChild;
    fragment.appendChild(temp.firstChild);
  }

  range.insertNode(fragment);

  if (!lastNode) return;

  const after = document.createRange();
  after.setStartAfter(lastNode);
  after.collapse(true);
  selection.removeAllRanges();
  selection.addRange(after);
}
