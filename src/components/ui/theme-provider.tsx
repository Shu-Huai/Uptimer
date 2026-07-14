"use client";

import { createContext, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";

import { cycleTheme, isThemePreference, resolveTheme, type ThemePreference } from "@/lib/theme";

const STORAGE_KEY = "uptimer-theme";

type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  cycleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

let themeSnapshot: ThemePreference = "system";
const themeListeners = new Set<() => void>();

function subscribeTheme(listener: () => void) {
  themeListeners.add(listener);
  return () => themeListeners.delete(listener);
}

function getThemeSnapshot(): ThemePreference {
  return themeSnapshot;
}

function readStoredTheme(): unknown {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage?.getItem(STORAGE_KEY) ?? null;
  } catch {
    return null;
  }
}

function persistTheme(theme: ThemePreference): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage?.setItem(STORAGE_KEY, theme);
  } catch {
    // ArkWeb may expose localStorage as null or reject access for HTTP pages.
  }
}

function setThemeSnapshot(theme: ThemePreference): void {
  themeSnapshot = theme;
  persistTheme(theme);
  themeListeners.forEach((listener) => listener());
}

function getThemeServerSnapshot(): ThemePreference {
  return "system";
}

function subscribeSystemTheme(listener: () => void) {
  if (typeof window === "undefined") return () => undefined;
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  mediaQuery.addEventListener("change", listener);
  return () => mediaQuery.removeEventListener("change", listener);
}

function getSystemThemeSnapshot(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function getSystemThemeServerSnapshot(): boolean {
  return false;
}

function applyTheme(theme: ThemePreference, prefersDark: boolean): ResolvedTheme {
  const resolvedTheme = resolveTheme(theme, prefersDark);
  const root = document.documentElement;
  root.dataset.theme = resolvedTheme;
  root.classList.toggle("dark", resolvedTheme === "dark");
  root.style.colorScheme = resolvedTheme;
  return resolvedTheme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getThemeServerSnapshot);
  const prefersDark = useSyncExternalStore(
    subscribeSystemTheme,
    getSystemThemeSnapshot,
    getSystemThemeServerSnapshot,
  );
  const resolvedTheme = resolveTheme(theme, prefersDark);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedTheme = readStoredTheme();
    const initialTheme = isThemePreference(storedTheme) ? storedTheme : "system";
    if (initialTheme !== themeSnapshot) setThemeSnapshot(initialTheme);
  }, []);

  useEffect(() => {
    applyTheme(theme, prefersDark);
  }, [prefersDark, theme]);

  const value = useMemo<ThemeContextValue>(() => ({
    theme,
    resolvedTheme,
    cycleTheme: () => setThemeSnapshot(cycleTheme(theme)),
  }), [resolvedTheme, theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
