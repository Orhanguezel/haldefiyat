import type { ThemeMode, ThemePreset } from "./theme.types";
import {
  DEFAULT_PRESET,
  DEFAULT_THEME,
  PRESET_STORAGE_KEY,
  THEME_STORAGE_KEY,
} from "./theme.constants";

/** Root DOM'da data-theme ve color-scheme atar. */
export function applyThemeMode(mode: ThemeMode): void {
  const root = document.documentElement;
  root.setAttribute("data-theme", mode);
  root.style.colorScheme = mode;
}

/** Root DOM'da data-theme-preset atar. */
export function applyThemePreset(preset: ThemePreset): void {
  document.documentElement.setAttribute("data-theme-preset", preset);
}

/** localStorage'dan kayıtlı modu okur. */
export function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return DEFAULT_THEME;
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "dark" ? "dark" : DEFAULT_THEME;
}

/** localStorage'dan kayıtlı preset'i okur. */
export function getStoredPreset(): ThemePreset {
  if (typeof window === "undefined") return DEFAULT_PRESET;
  const stored = localStorage.getItem(PRESET_STORAGE_KEY);
  return (stored as ThemePreset) ?? DEFAULT_PRESET;
}

/** Modu localStorage'a kaydeder ve DOM'a uygular. */
export function persistTheme(mode: ThemeMode): void {
  localStorage.setItem(THEME_STORAGE_KEY, mode);
  applyThemeMode(mode);
}

/** Preset'i localStorage'a kaydeder ve DOM'a uygular. */
export function persistPreset(preset: ThemePreset): void {
  localStorage.setItem(PRESET_STORAGE_KEY, preset);
  applyThemePreset(preset);
}
