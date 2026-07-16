# 日期时间选择器指针拖拽 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为添加记录表单的日期和时间滚轮增加跟手的鼠标/触摸拖拽，并在松开后平滑吸附到最近选项。

**Architecture:** 抽取一个无 DOM 的拖拽位置计算函数，供 `WheelColumn` 的 Pointer Events 逻辑使用并单元测试。`WheelColumn` 在指针按下时记录起点，移动时直接更新滚动位置，释放时复用现有的索引计算和 `scrollTo({ behavior: "smooth" })`；拖动状态通过 class 和 CSS 控制 scroll snap 与光标。

**Tech Stack:** React 19, TypeScript, CSS scroll snap, Node `tsx --test`。

---

### Task 1: 添加拖拽位置计算测试

**Files:**
- Create: `src/components/records/datetime-wheel-drag.test.ts`
- Create: `src/components/records/datetime-wheel-drag.ts`

- [ ] **Step 1: Write the failing test**

在测试中覆盖纵向/横向拖拽和边界限制，期望工具函数按“起始滚动位置 - 指针位移”计算新位置：

```ts
import test from "node:test";
import assert from "node:assert/strict";

import { calculateDragScrollPosition } from "./datetime-wheel-drag";

test("calculates vertical drag position from pointer movement", () => {
  assert.equal(calculateDragScrollPosition(120, 300, 180, 36, 10), 240);
});

test("calculates horizontal drag position from pointer movement", () => {
  assert.equal(calculateDragScrollPosition(80, 40, 120, 48, 8), 0);
});

test("clamps drag position to the available option range", () => {
  assert.equal(calculateDragScrollPosition(0, 100, 0, 36, 4), 0);
  assert.equal(calculateDragScrollPosition(500, 0, 100, 36, 4), 108);
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npx tsx --test src/components/records/datetime-wheel-drag.test.ts`

Expected: FAIL because `datetime-wheel-drag.ts` and `calculateDragScrollPosition` do not exist yet.

- [ ] **Step 3: Implement the minimal pure helper**

Create `calculateDragScrollPosition(startScroll, startPointer, currentPointer, itemSize, optionCount)` that returns `clamp(startScroll - (currentPointer - startPointer), 0, Math.max(0, (optionCount - 1) * itemSize))`.

- [ ] **Step 4: Run the focused test and verify it passes**

Run: `npx tsx --test src/components/records/datetime-wheel-drag.test.ts`

Expected: all 3 tests PASS.

### Task 2: Integrate Pointer Events into the wheel column

**Files:**
- Modify: `src/components/records/datetime-wheel-picker.tsx:1-188`

- [ ] **Step 1: Reuse the verified drag-position contract**

The pointer event wiring is a browser interaction, while this repository has no DOM test runner. Use the already red/green-tested `calculateDragScrollPosition` contract from Task 1 as the implementation boundary: pointer movement must call it with the active axis size and option count, and only release must call `settleSelection`.

```ts
test("keeps drag movement continuous before release", () => {
  const startScroll = 72;
  const nextScroll = calculateDragScrollPosition(startScroll, 100, 148, 36, 24);
  assert.equal(nextScroll, 24);
});
```

- [ ] **Step 2: Implement minimal drag behavior**

In `WheelColumn`:

```tsx
const pointerRef = useRef<{ id: number; startPointer: number; startScroll: number; moved: boolean } | null>(null);

function pointerPosition(event: React.PointerEvent<HTMLDivElement>) {
  return horizontal ? event.clientX : event.clientY;
}

function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
  if (event.pointerType === "mouse" && event.button !== 0) return;
  const scroller = scrollerRef.current;
  if (!scroller) return;
  pointerRef.current = {
    id: event.pointerId,
    startPointer: pointerPosition(event),
    startScroll: horizontal ? scroller.scrollLeft : scroller.scrollTop,
    moved: false,
  };
  scroller.setPointerCapture(event.pointerId);
}

function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
  const drag = pointerRef.current;
  const scroller = scrollerRef.current;
  if (!drag || drag.id !== event.pointerId || !scroller) return;
  const current = pointerPosition(event);
  if (Math.abs(current - drag.startPointer) > 4) drag.moved = true;
  const next = calculateDragScrollPosition(
    drag.startScroll,
    drag.startPointer,
    current,
    horizontal ? HORIZONTAL_ITEM_WIDTH : ITEM_HEIGHT,
    options.length,
  );
  if (horizontal) scroller.scrollLeft = next;
  else scroller.scrollTop = next;
}
```

On `pointerup`, `pointercancel`, and `lostpointercapture`, clear the ref; if the pointer moved, set a `suppressClickRef` flag, then call `settleSelection()`. Add `onPointerDown`, `onPointerMove`, `onPointerUp`, `onPointerCancel`, and `onLostPointerCapture` to the scroller. In the option button click handler, consume and clear `suppressClickRef` before returning; otherwise keep `onClick={() => onSelect(index)}` for non-drag taps/clicks.

- [ ] **Step 3: Run focused and existing tests**

Run: `npx tsx --test src/components/records/datetime-wheel-drag.test.ts src/lib/theme.test.ts`

Expected: all tests PASS.

### Task 3: Add drag-specific CSS and verify the project

**Files:**
- Modify: `src/app/globals.css:693-708`

- [ ] **Step 1: Add drag CSS**

Add a grab cursor and disable snap only during an active drag:

```css
.up-wheel-col {
  cursor: grab;
}

.up-wheel-col.is-dragging {
  cursor: grabbing;
  scroll-snap-type: none;
  user-select: none;
}
```

Use the existing horizontal selector to set `touch-action: pan-x` and the vertical selector to set `touch-action: pan-y`; do not alter the existing scroll dimensions.

- [ ] **Step 2: Run validation**

Run: `npm test`

Expected: existing tests and the new drag tests pass.

Run: `npm run lint`

Expected: exit code 0; any warnings are pre-existing generated Harmony files and no new errors are introduced.

Run: `npm run build`

Expected: Next build completes successfully.

- [ ] **Step 3: Review the final diff**

Run: `git diff --check` and `git diff --stat`.

Confirm only the drag helper/test, `datetime-wheel-picker.tsx`, `globals.css`, and this plan are changed beyond the already committed design document.
