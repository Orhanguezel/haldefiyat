// ThemeConfig lokal tip tanimi — @agro/shared-types'a bagimlilik olmadan calisir
interface ThemeConfig {
  colors: {
    primary: string; primaryDark: string; accent: string;
    background: string; surfaceBase: string; surfaceRaised: string; surfaceMuted: string;
    textStrong: string; textBody: string; textMuted: string;
    border: string; borderLight: string;
    navBg: string; navFg: string; footerBg: string; footerFg: string;
    success: string; warning: string; danger: string;
    surfaceDarkBg: string; surfaceDarkText: string; surfaceDarkHeading: string;
  };
  typography: { fontHeading: string; fontBody: string };
  radius: string;
}

/**
 * ThemeConfig'i body uzerinde inline CSS degiskenlere donusturur.
 * globals.css @theme fallback degerlerini runtime'da ezer.
 */
export function themeConfigToCssVars(theme: ThemeConfig): Record<string, string> {
  const { colors: c, typography: t, radius } = theme;
  return {
    '--color-brand': c.primary,
    '--color-brand-dark': c.primaryDark,
    '--color-frost': c.accent,
    '--color-frost-dark': c.navBg,
    '--color-bg': c.background,
    '--color-bg-alt': c.surfaceRaised,
    '--color-surface': c.surfaceBase,
    '--color-surface-muted': c.surfaceMuted,
    '--color-text': c.textStrong,
    '--color-text-secondary': c.textBody,
    '--color-text-muted': c.textMuted,
    '--color-border': c.borderLight,
    '--color-border-strong': c.border,
    '--color-nav-bg': c.navBg,
    '--color-nav-fg': c.navFg,
    '--color-footer-bg': c.footerBg,
    '--color-footer-fg': c.footerFg,
    '--color-safe': c.success,
    '--color-warn': c.warning,
    '--color-danger': c.danger,
    '--color-dark-bg': c.surfaceDarkBg,
    '--color-dark-text': c.surfaceDarkText,
    '--color-dark-heading': c.surfaceDarkHeading,
    '--font-heading': t.fontHeading,
    '--font-body': t.fontBody,
    '--radius': radius,
  };
}
