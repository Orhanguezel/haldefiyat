import type { ThemeMode, ThemePreset } from "./theme.types";

export const THEME_STORAGE_KEY = "pj-theme" as const;
export const PRESET_STORAGE_KEY = "pj-theme-preset" as const;

export const DEFAULT_THEME: ThemeMode = "light";
export const DEFAULT_PRESET: ThemePreset = "default";

export const PRESET_LIST: ThemePreset[] = ["default"];
