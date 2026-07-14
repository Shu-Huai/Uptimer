export type ThemePreference = "light" | "dark" | "system";

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

export function getNextTheme(theme: ThemePreference): ThemePreference {
  if (theme === "light") return "dark";
  if (theme === "dark") return "system";
  return "light";
}

export function resolveTheme(theme: ThemePreference, prefersDark: boolean): "light" | "dark" {
  if (theme === "system") return prefersDark ? "dark" : "light";
  return theme;
}

export function resolveSystemTheme(nativeDark: boolean | undefined, mediaQueryDark: boolean): boolean {
  return nativeDark ?? mediaQueryDark;
}

export function cycleTheme(theme: ThemePreference): ThemePreference {
  return isThemePreference(theme) ? getNextTheme(theme) : "light";
}
