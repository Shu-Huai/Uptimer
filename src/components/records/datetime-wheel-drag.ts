function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function calculateDragScrollPosition(
  startScroll: number,
  startPointer: number,
  currentPointer: number,
  itemSize: number,
  optionCount: number,
) {
  const maxScroll = Math.max(0, (optionCount - 1) * itemSize);
  return clamp(startScroll - (currentPointer - startPointer), 0, maxScroll);
}
