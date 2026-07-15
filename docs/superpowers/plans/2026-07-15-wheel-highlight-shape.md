# Wheel Highlight Shape Adjustment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Change only the date-time wheel's selected highlight from a full circle to a softly rounded rectangle so wide labels fit visually.

**Architecture:** Keep the existing `DateTimeWheelPicker` markup and selection behavior unchanged. Modify the shared global CSS rule for the highlight overlay, which already sits above the wheel items and is reused by both light and dark themes.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind CSS 4, global CSS, npm scripts.

---

### Task 1: Adjust the wheel highlight shape

**Files:**
- Modify: `E:/JetBrains/WebStorm/Uptimer/src/app/globals.css:581-594`
- Test: visual behavior through the existing wheel component; no new automated test file is needed for a static CSS-only change.

- [ ] **Step 1: Change only the highlight corner radius**

In `.up-wheel-highlight`, replace:

```css
border-radius: 999px;
```

with:

```css
border-radius: 12px;
```

Keep `left`, `right`, `top`, `height`, border, background, shadow, stacking order, and pointer behavior unchanged. Do not modify `.up-wheel-col-wrap`, `.up-wheel-item`, or the date-time picker component.

- [ ] **Step 2: Run lint**

Run:

```bash
npm run lint
```

Expected: exit code 0 with no lint errors.

- [ ] **Step 3: Run the production build**

Run:

```bash
npm run build
```

Expected: exit code 0 and a successful Next.js production build, confirming the global CSS remains valid.

- [ ] **Step 4: Review the final diff**

Run:

```bash
git diff -- src/app/globals.css
```

Expected: the diff contains only the `.up-wheel-highlight` `border-radius` value change.

- [ ] **Step 5: Commit the implementation**

Run:

```bash
git add src/app/globals.css
git commit -m "fix: round wheel highlight corners"
```

Expected: one commit containing only the CSS adjustment.
