import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  cycleTheme,
  getNextTheme,
  resolveSystemTheme,
  resolveTheme,
  shouldUseSystemTheme,
  type ThemePreference,
} from "./theme";

describe("theme preference", () => {
  it("cycles light to dark to system to light", () => {
    assert.equal(getNextTheme("light"), "dark");
    assert.equal(getNextTheme("dark"), "system");
    assert.equal(getNextTheme("system"), "light");
  });

  it("resolves system preference from the media query result", () => {
    assert.equal(resolveTheme("system", true), "dark");
    assert.equal(resolveTheme("system", false), "light");
    assert.equal(resolveTheme("dark", false), "dark");
    assert.equal(resolveTheme("light", true), "light");
  });

  it("prefers the native HarmonyOS theme value over ArkWeb media query state", () => {
    assert.equal(resolveSystemTheme(true, false), true);
    assert.equal(resolveSystemTheme(false, true), false);
    assert.equal(resolveSystemTheme(undefined, true), true);
  });

  it("only lets native system theme updates affect the system preference", () => {
    assert.equal(shouldUseSystemTheme("system"), true);
    assert.equal(shouldUseSystemTheme("light"), false);
    assert.equal(shouldUseSystemTheme("dark"), false);
  });

  it("falls back to light when cycling an invalid persisted preference", () => {
    assert.equal(cycleTheme("unknown" as ThemePreference), "light");
  });
});
