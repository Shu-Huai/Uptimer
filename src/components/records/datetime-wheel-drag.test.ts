import assert from "node:assert/strict";
import test from "node:test";

import { calculateDragScrollPosition } from "./datetime-wheel-drag";

test("calculates vertical drag position from pointer movement", () => {
  assert.equal(calculateDragScrollPosition(120, 300, 180, 36, 10), 240);
});

test("calculates horizontal drag position from pointer movement", () => {
  assert.equal(calculateDragScrollPosition(80, 40, 120, 48, 8), 0);
});

test("keeps drag movement continuous before release", () => {
  assert.equal(calculateDragScrollPosition(72, 100, 148, 36, 24), 24);
});

test("clamps drag position to the available option range", () => {
  assert.equal(calculateDragScrollPosition(0, 100, 200, 36, 4), 0);
  assert.equal(calculateDragScrollPosition(500, 0, 100, 36, 4), 108);
});
