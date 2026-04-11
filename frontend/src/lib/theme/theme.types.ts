export type ThemeMode = "light" | "dark";

/**
 * Preset sistemi ileride white-label / kampanya için genişletilebilir.
 * Şu an yalnızca "default" aktif.
 */
export type ThemePreset = "default";

export interface ThemeState {
  mode: ThemeMode;
  preset: ThemePreset;
}
