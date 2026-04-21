// =============================================================
// FILE: src/integrations/shared/theme-types.ts
// =============================================================
import type { ThemeDarkMode, ThemeRadius } from './theme-admin-types';

export type ColorTokens = {
  primary: string;
  accent: string;
  background: string;
  surfaceBase: string;
  surfaceRaised: string;
  border: string;
  textStrong: string;
  textBody: string;
  textMuted: string;
  navBg: string;
  navFg: string;
  surfaceDarkBg: string;
  surfaceDarkHeading: string;
  surfaceDarkText: string;
  footerBg: string;
  footerFg: string;
};

export type ThemeTypography = {
  fontHeading: string;
  fontBody: string;
};

export type ThemeConfig = {
  colors: ColorTokens;
  typography: ThemeTypography;
  radius: ThemeRadius;
  darkMode: ThemeDarkMode;
};

export type ThemeUpdateInput = Partial<ThemeConfig>;

export const COLOR_TOKEN_LABELS: Record<keyof ColorTokens, { label: string; group: string }> = {
  primary: { label: 'Primary', group: 'Brand' },
  accent: { label: 'Accent', group: 'Brand' },
  background: { label: 'Background', group: 'Surface' },
  surfaceBase: { label: 'Surface Base', group: 'Surface' },
  surfaceRaised: { label: 'Surface Raised', group: 'Surface' },
  border: { label: 'Border', group: 'Surface' },
  textStrong: { label: 'Text Strong', group: 'Text' },
  textBody: { label: 'Text Body', group: 'Text' },
  textMuted: { label: 'Text Muted', group: 'Text' },
  navBg: { label: 'Navbar Background', group: 'Shell' },
  navFg: { label: 'Navbar Text', group: 'Shell' },
  surfaceDarkBg: { label: 'Dark Surface', group: 'Shell' },
  surfaceDarkHeading: { label: 'Dark Heading', group: 'Shell' },
  surfaceDarkText: { label: 'Dark Text', group: 'Shell' },
  footerBg: { label: 'Footer Background', group: 'Shell' },
  footerFg: { label: 'Footer Text', group: 'Shell' },
};

export const RADIUS_OPTIONS: Array<{ value: ThemeRadius; label: string }> = [
  { value: '0rem', label: 'None' },
  { value: '0.3rem', label: 'Small' },
  { value: '0.375rem', label: 'Default' },
  { value: '0.5rem', label: 'Medium' },
  { value: '0.75rem', label: 'Large' },
  { value: '1rem', label: 'XL' },
  { value: '1.5rem', label: '2XL' },
];

export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  colors: {
    primary: '#f97316',
    accent: '#fee8d6',
    background: '#f8fafc',
    surfaceBase: '#ffffff',
    surfaceRaised: '#ffffff',
    border: '#cbd5e1',
    textStrong: '#0f172a',
    textBody: '#334155',
    textMuted: '#64748b',
    navBg: '#0f2340',
    navFg: '#ffffff',
    surfaceDarkBg: '#111827',
    surfaceDarkHeading: '#f8fafc',
    surfaceDarkText: '#cbd5e1',
    footerBg: '#0f2340',
    footerFg: '#ffffff',
  },
  typography: {
    fontHeading: 'DM Sans, system-ui, sans-serif',
    fontBody: 'DM Sans, system-ui, sans-serif',
  },
  radius: '0.375rem',
  darkMode: 'light',
};
