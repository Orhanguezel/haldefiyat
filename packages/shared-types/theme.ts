export interface ColorTokens {
  primary: string;
  primaryDark: string;
  accent: string;
  background: string;
  surfaceBase: string;
  surfaceRaised: string;
  surfaceMuted: string;
  textStrong: string;
  textBody: string;
  textMuted: string;
  border: string;
  borderLight: string;
  navBg: string;
  navFg: string;
  footerBg: string;
  footerFg: string;
  success: string;
  warning: string;
  danger: string;
  surfaceDarkBg: string;
  surfaceDarkText: string;
  surfaceDarkHeading: string;
}

export interface TypographyConfig {
  fontHeading: string;
  fontBody: string;
}

export interface SectionBackground {
  key: string;
  bg: string;
  overlay?: string;
  textColor?: string;
  headingColor?: string;
}

export interface ThemeConfig {
  colors: ColorTokens;
  typography: TypographyConfig;
  radius: string;
  darkMode: 'light' | 'dark' | 'system';
  sectionBackgrounds: SectionBackground[];
}

export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  colors: {
    primary: '#F97316',
    primaryDark: '#D4610B',
    accent: '#FEE8D6',
    background: '#F8FAFC',
    surfaceBase: '#EEF2F7',
    surfaceRaised: '#FFFFFF',
    surfaceMuted: '#FFF4ED',
    textStrong: '#0F172A',
    textBody: '#64748B',
    textMuted: '#94A3B8',
    border: '#CBD5E1',
    borderLight: '#E2E8F0',
    navBg: '#0F2340',
    navFg: '#FFFFFF',
    footerBg: '#0F2340',
    footerFg: '#E2E8F0',
    success: '#16A34A',
    warning: '#F59E0B',
    danger: '#EF4444',
    surfaceDarkBg: '#0F2340',
    surfaceDarkText: '#E2E8F0',
    surfaceDarkHeading: '#F97316',
  },
  typography: {
    fontHeading: 'DM Sans, system-ui, -apple-system, sans-serif',
    fontBody: 'DM Sans, system-ui, -apple-system, sans-serif',
  },
  radius: '0.5rem',
  darkMode: 'light',
  sectionBackgrounds: [
    { key: 'hero', bg: 'transparent', overlay: 'rgba(15,35,64,0.7)' },
    { key: 'how_it_works', bg: '#FFFFFF' },
    { key: 'products_list', bg: '#EEF2F7' },
    { key: 'benefits', bg: '#FFFFFF' },
    { key: 'testimonials', bg: '#FFF4ED' },
    { key: 'faq', bg: '#FFFFFF' },
    { key: 'cta', bg: '#0F2340', textColor: '#FFFFFF', headingColor: '#F97316' },
  ],
};
