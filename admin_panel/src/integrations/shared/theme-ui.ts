import { Monitor, Moon, Sun } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ThemeDarkMode } from '@/integrations/shared/theme-admin-types';
import type { ColorTokens, ThemeConfig } from '@/integrations/shared/theme-types';
import { COLOR_TOKEN_LABELS, DEFAULT_THEME_CONFIG } from '@/integrations/shared/theme-types';

export const THEME_FONT_HEADING_PLACEHOLDER = 'Syne, system-ui, sans-serif';
export const THEME_FONT_BODY_PLACEHOLDER = 'DM Sans, system-ui, sans-serif';
export const THEME_COLOR_HEX_PLACEHOLDER = '#000000';
export const THEME_RADIUS_PREVIEW_SIZES = ['sm', 'md', 'lg'] as const;

export type ThemeDarkModeOption = {
  value: ThemeDarkMode;
  icon: LucideIcon;
  labelKey: 'darkModeLight' | 'darkModeDark' | 'darkModeSystem';
};

export const THEME_DARK_MODE_OPTIONS: ThemeDarkModeOption[] = [
  { value: 'light', icon: Sun, labelKey: 'darkModeLight' },
  { value: 'dark', icon: Moon, labelKey: 'darkModeDark' },
  { value: 'system', icon: Monitor, labelKey: 'darkModeSystem' },
];

export function toThemeDraft(theme: any): ThemeConfig {
  const colors = theme?.colors ?? {};
  const fontFamily = theme?.fontFamily || DEFAULT_THEME_CONFIG.typography.fontBody;

  return {
    colors: {
      primary: colors.primary || DEFAULT_THEME_CONFIG.colors.primary,
      accent: colors.accent || colors.secondary || DEFAULT_THEME_CONFIG.colors.accent,
      background: colors.background || DEFAULT_THEME_CONFIG.colors.background,
      surfaceBase: colors.background || DEFAULT_THEME_CONFIG.colors.surfaceBase,
      surfaceRaised: colors.background || DEFAULT_THEME_CONFIG.colors.surfaceRaised,
      border: colors.border || DEFAULT_THEME_CONFIG.colors.border,
      textStrong: colors.foreground || DEFAULT_THEME_CONFIG.colors.textStrong,
      textBody: colors.foreground || DEFAULT_THEME_CONFIG.colors.textBody,
      textMuted: colors.mutedFg || DEFAULT_THEME_CONFIG.colors.textMuted,
      navBg: colors.navBg || DEFAULT_THEME_CONFIG.colors.navBg,
      navFg: colors.navFg || DEFAULT_THEME_CONFIG.colors.navFg,
      surfaceDarkBg: colors.footerBg || DEFAULT_THEME_CONFIG.colors.surfaceDarkBg,
      surfaceDarkHeading: colors.footerFg || DEFAULT_THEME_CONFIG.colors.surfaceDarkHeading,
      surfaceDarkText: colors.footerFg || DEFAULT_THEME_CONFIG.colors.surfaceDarkText,
      footerBg: colors.footerBg || DEFAULT_THEME_CONFIG.colors.footerBg,
      footerFg: colors.footerFg || DEFAULT_THEME_CONFIG.colors.footerFg,
    },
    typography: {
      fontHeading: fontFamily,
      fontBody: fontFamily,
    },
    radius: theme?.radius || DEFAULT_THEME_CONFIG.radius,
    darkMode: theme?.darkMode || DEFAULT_THEME_CONFIG.darkMode,
  };
}

export function groupThemeColorTokens(): Map<string, Array<keyof ColorTokens>> {
  const groups = new Map<string, Array<keyof ColorTokens>>();

  for (const [key, meta] of Object.entries(COLOR_TOKEN_LABELS)) {
    const group = meta.group;
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)?.push(key as keyof ColorTokens);
  }

  return groups;
}
