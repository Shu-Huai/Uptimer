# Global Theme and Header Icons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the header text/menu controls with accessible SVG icon buttons and add a persistent light/dark/system theme cycle covering the entire application.

**Architecture:** Add a small client-side theme controller with pure state-transition helpers. The controller stores the user preference in `localStorage`, resolves `system` through `matchMedia`, applies an effective theme class/data attribute to `<html>`, and exposes a cycle button to `AppShell`. Use CSS variables for shared design tokens and targeted `.dark`/`[data-theme="dark"]` overrides for existing hard-coded utility classes so the current light design remains unchanged.

**Tech Stack:** Next.js 16 App Router, React 19 client components, TypeScript, Iconify SVG icons, CSS variables, Node built-in test runner through `tsx`.

---

### Task 1: Add testable theme state helpers

**Files:**
- Create: `src/lib/theme.ts`
- Test: `src/lib/theme.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Write the failing tests**

Create tests for the requested state machine:

```ts
import { describe, expect, it } from "node:test";
import { cycleTheme, getNextTheme, resolveTheme, type ThemePreference } from "./theme";

describe("theme preference", () => {
  it("cycles light to dark to system to light", () => {
    expect(getNextTheme("light")).toBe("dark");
    expect(getNextTheme("dark")).toBe("system");
    expect(getNextTheme("system")).toBe("light");
  });

  it("resolves system preference from the media query result", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
    expect(resolveTheme("light", true)).toBe("light");
  });

  it("rejects invalid persisted preferences by falling back to system", () => {
    expect(cycleTheme("unknown" as ThemePreference)).toBe("light");
  });
});
```

- [ ] **Step 2: Run the test and verify it fails for the missing module**

Run:

```powershell
npx tsx --test src/lib/theme.test.ts
```

Expected: fail because `src/lib/theme.ts` does not exist.

- [ ] **Step 3: Implement the minimal pure helpers**

Implement `ThemePreference = "light" | "dark" | "system"`, `getNextTheme`, `resolveTheme`, and `cycleTheme`. `cycleTheme` must validate persisted input and return `"light"` for invalid values before cycling.

- [ ] **Step 4: Run the test and verify it passes**

Run:

```powershell
npx tsx --test src/lib/theme.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Add the test script**

Add this package script without changing existing scripts:

```json
"test": "tsx --test src/lib/theme.test.ts"
```

Run `npm test` and verify the same tests pass.

### Task 2: Add the client theme provider and persistence

**Files:**
- Create: `src/components/ui/theme-provider.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Implement `ThemeProvider`**

The provider must:

1. Use `useState<ThemePreference>("system")` initially.
2. On mount, read `localStorage.getItem("uptimer-theme")`, validate it with `isThemePreference`, and apply the effective theme.
3. Use `window.matchMedia("(prefers-color-scheme: dark)")` to resolve `system`.
4. Subscribe to media-query changes only while the preference is `system`.
5. Apply `document.documentElement.dataset.theme = "light" | "dark"` and toggle the `dark` class for compatibility.
6. Persist every explicit preference change under `uptimer-theme`.
7. Expose `theme`, `resolvedTheme`, and `cycleTheme()` through context.

- [ ] **Step 2: Wrap the application**

In `src/app/layout.tsx`, wrap `AppShell` with `ThemeProvider` inside the existing `<body>` and preserve the current ArkWeb-safe layout structure.

- [ ] **Step 3: Verify theme transitions manually in the browser**

Run `npm run dev`, open the app, click the theme control three times, refresh, and confirm the selected preference persists. Use browser DevTools to verify `<html data-theme="dark">` and the `dark` class in dark mode.

### Task 3: Replace the header controls with SVG icon buttons

**Files:**
- Modify: `src/components/ui/app-shell.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Implement header markup**

Remove the hamburger icon and its wrapper. Replace the two text controls with:

```tsx
<Link href="/activities" className="uptimer-icon-button" aria-label="活动管理" title="活动管理">
  <IconifyIcon icon="solar:widget-4-outline" className="up-icon up-icon-md" />
</Link>
<form action={logoutAction}>
  <button type="submit" className="uptimer-icon-button" aria-label="退出" title="退出">
    <IconifyIcon icon="solar:logout-2-outline" className="up-icon up-icon-md" />
  </button>
</form>
```

Add the theme cycle button using `solar:sun-2-outline`, `solar:moon-outline`, and `solar:monitor-outline` based on the current preference. Keep the existing logo link and logout server action unchanged.

- [ ] **Step 2: Add icon-button styles**

Create `.uptimer-icon-button` beside the existing header styles with the current rounded-button interaction, 40px minimum hit area, theme-aware border/background/text colors, focus-visible outline, and no visible text.

- [ ] **Step 3: Verify header behavior**

Confirm the hamburger is absent, all three icon buttons have accessible labels, activity navigation works, logout still submits, and the theme icon changes after each click.

### Task 4: Convert shared design tokens and major surfaces to dark theme

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/analysis/page.tsx`
- Modify: `src/components/activities/activity-list-manager.tsx`
- Modify: `src/components/activities/activity-create-form.tsx`
- Modify: `src/components/activities/activity-edit-form.tsx`
- Modify: `src/components/goals/goal-activity-picker.tsx`
- Modify: `src/components/timer/timer-panel.tsx`
- Modify: `src/components/ui/iconify-picker.tsx`
- Modify: `src/components/ui/section-card.tsx`
- Modify: `src/components/analysis/analysis-placeholder.tsx`
- Modify: `src/components/goals/goals-placeholder.tsx`
- Modify: `src/components/rewards/rewards-placeholder.tsx`

- [ ] **Step 1: Add dark token definitions**

Define dark overrides for `--uptimer-bg`, `--uptimer-card`, `--uptimer-text`, `--uptimer-muted`, `--uptimer-line`, `--uptimer-primary-soft`, and shadow tokens under `[data-theme="dark"]`. Keep semantic success/loss/warning colors readable.

- [ ] **Step 2: Update shared CSS classes first**

Change `.uptimer-shell`, `.uptimer-brand`, `.uptimer-content`, `.uptimer-tabbar`, `.up-card`, `.up-soft-panel`, `.up-pill`, form controls, overlays, dialogs, date pickers, and feedback banners to consume the shared variables. Add targeted dark selectors for existing fixed light utility classes that cannot use CSS variables directly.

- [ ] **Step 3: Replace repeated hard-coded page colors where selectors are dynamic**

For JSX class strings in the listed files that determine borders/backgrounds based on state, replace only the shared neutral colors with semantic classes or add dark variants; preserve positive/negative/primary color semantics.

- [ ] **Step 4: Verify every route visually**

Check `/records`, `/timer`, `/analysis`, `/goals`, `/points`, `/rewards`, `/activities`, their create/edit pages, and auth pages in dark mode. Check overlays and forms, including icon picker and record backfill sheet, for unreadable text or white surfaces.

### Task 5: Verify, commit, and push

**Files:**
- No additional files; use all files changed by Tasks 1–4.

- [ ] **Step 1: Run automated checks**

Run:

```powershell
npm test
npm run lint
npm run build
git diff --check
```

Expected: tests, lint, build, and whitespace checks pass.

- [ ] **Step 2: Test the ArkWeb path**

Run the local DevEco build from `harmony/UptimerArkWeb` with the configured local signing profile. Open the remote site in the installed HAP and verify theme persistence, system-follow behavior, and icon buttons.

- [ ] **Step 3: Commit source changes**

Do not stage `harmony/UptimerArkWeb/build-profile.json5`; it contains local signing configuration. Commit the source with:

```powershell
git add src docs
git commit -m "feat: add global theme switching and header icons"
```

- [ ] **Step 4: Push `master`**

```powershell
git push origin master
```
