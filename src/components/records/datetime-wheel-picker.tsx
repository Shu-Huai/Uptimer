"use client";

import { format } from "date-fns";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, ReactNode, WheelEvent } from "react";

import { calculateDragScrollPosition } from "@/components/records/datetime-wheel-drag";
import { formatDateTimeInput } from "@/lib/time";

const ITEM_HEIGHT = 36;
const HORIZONTAL_ITEM_WIDTH = 48;
const VISIBLE_ROWS = 5;
const WHEEL_PADDING = ((VISIBLE_ROWS - 1) / 2) * ITEM_HEIGHT;
const DAY_RANGE = 365;

type WheelOption = {
  label: string;
  subLabel?: string;
};

type WheelColumnProps = {
  ariaLabel: string;
  options: WheelOption[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  horizontal?: boolean;
};

type DateTimeWheelPickerProps = {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  actions?: ReactNode;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function parseDateInput(value: string): Date {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }

  parsed.setMilliseconds(0);
  return parsed;
}

function buildDayList(anchor: Date) {
  const today = format(new Date(), "yyyy-MM-dd");
  const start = new Date(anchor);
  start.setDate(start.getDate() - DAY_RANGE);
  start.setHours(0, 0, 0, 0);

  return Array.from({ length: DAY_RANGE * 2 + 1 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    const key = format(day, "yyyy-MM-dd");

    return {
      key,
      day,
      label: key === today ? "今天" : format(day, "MM/dd"),
      subLabel: format(day, "EEE"),
    };
  });
}

function WheelColumn({ ariaLabel, options, selectedIndex, onSelect, horizontal = false }: WheelColumnProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const settleTimerRef = useRef<number | null>(null);
  const syncedTimerRef = useRef<number | null>(null);
  const syncingRef = useRef(false);
  const hasMountedRef = useRef(false);
  const pointerRef = useRef<{
    id: number;
    startPointer: number;
    startScroll: number;
    moved: boolean;
  } | null>(null);
  const suppressClickRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  const syncToIndex = useCallback(
    (index: number, behavior: ScrollBehavior = "auto") => {
      const scroller = scrollerRef.current;
      if (!scroller) return;

      syncingRef.current = true;
      scroller.scrollTo(
        horizontal ? { left: index * HORIZONTAL_ITEM_WIDTH, behavior } : { top: index * ITEM_HEIGHT, behavior },
      );
      if (syncedTimerRef.current) {
        window.clearTimeout(syncedTimerRef.current);
      }
      syncedTimerRef.current = window.setTimeout(() => {
        syncingRef.current = false;
      }, 120);
    },
    [horizontal],
  );

  useEffect(() => {
    syncToIndex(selectedIndex, hasMountedRef.current ? "smooth" : "auto");
    hasMountedRef.current = true;
  }, [selectedIndex, syncToIndex]);

  useEffect(
    () => () => {
      if (settleTimerRef.current) {
        window.clearTimeout(settleTimerRef.current);
      }
      if (syncedTimerRef.current) {
        window.clearTimeout(syncedTimerRef.current);
      }
    },
    [],
  );

  function settleSelection() {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const rawIndex = Math.round(
      (horizontal ? scroller.scrollLeft : scroller.scrollTop) / (horizontal ? HORIZONTAL_ITEM_WIDTH : ITEM_HEIGHT),
    );
    const nextIndex = clamp(rawIndex, 0, options.length - 1);
    if (nextIndex !== selectedIndex) {
      onSelect(nextIndex);
    } else {
      syncToIndex(nextIndex, "smooth");
    }
  }

  function handleScroll() {
    if (syncingRef.current || pointerRef.current) return;

    if (settleTimerRef.current) {
      window.clearTimeout(settleTimerRef.current);
    }
    settleTimerRef.current = window.setTimeout(() => settleSelection(), 90);
  }

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    if (!horizontal) return;

    const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
    if (!delta) return;

    event.preventDefault();
    scrollerRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  }

  function pointerPosition(event: ReactPointerEvent<HTMLDivElement>) {
    return horizontal ? event.clientX : event.clientY;
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
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

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = pointerRef.current;
    const scroller = scrollerRef.current;
    if (!drag || drag.id !== event.pointerId || !scroller) return;

    const currentPointer = pointerPosition(event);
    if (Math.abs(currentPointer - drag.startPointer) > 4) {
      drag.moved = true;
      setIsDragging(true);
      event.preventDefault();
    }

    const nextScroll = calculateDragScrollPosition(
      drag.startScroll,
      drag.startPointer,
      currentPointer,
      horizontal ? HORIZONTAL_ITEM_WIDTH : ITEM_HEIGHT,
      options.length,
    );
    if (horizontal) scroller.scrollLeft = nextScroll;
    else scroller.scrollTop = nextScroll;
  }

  function finishPointerDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = pointerRef.current;
    if (!drag || drag.id !== event.pointerId) return;

    if (settleTimerRef.current) {
      window.clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
    pointerRef.current = null;
    setIsDragging(false);
    if (drag.moved) suppressClickRef.current = true;
    settleSelection();
  }

  return (
    <div className={`up-wheel-col-wrap ${horizontal ? "is-horizontal" : ""}`}>
      <div
        ref={scrollerRef}
        className={`up-wheel-col ${horizontal ? "is-horizontal" : ""} ${isDragging ? "is-dragging" : ""}`}
        onScroll={handleScroll}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishPointerDrag}
        onPointerCancel={finishPointerDrag}
        onLostPointerCapture={finishPointerDrag}
        role="listbox"
        aria-label={ariaLabel}
      >
        <div
          className={horizontal ? "up-wheel-horizontal-spacer" : undefined}
          style={horizontal ? undefined : { height: WHEEL_PADDING }}
          aria-hidden
        />
        {options.map((option, index) => {
          const active = index === selectedIndex;
          return (
            <button
              key={`${option.label}-${index}`}
              type="button"
              onClick={() => {
                if (suppressClickRef.current) {
                  suppressClickRef.current = false;
                  return;
                }
                onSelect(index);
              }}
              className={`up-wheel-item ${horizontal ? "is-horizontal" : ""} ${active ? "is-active" : ""}`}
              role="option"
              aria-selected={active}
            >
              <span>{option.label}</span>
              {option.subLabel ? <small>{option.subLabel}</small> : null}
            </button>
          );
        })}
        <div
          className={horizontal ? "up-wheel-horizontal-spacer" : undefined}
          style={horizontal ? undefined : { height: WHEEL_PADDING }}
          aria-hidden
        />
      </div>
      <div className="up-wheel-highlight" aria-hidden />
    </div>
  );
}

function replaceDatePart(source: Date, day: Date) {
  const next = new Date(source);
  next.setFullYear(day.getFullYear(), day.getMonth(), day.getDate());
  return next;
}

function replaceHour(source: Date, hour: number) {
  const next = new Date(source);
  next.setHours(hour);
  return next;
}

function replaceMinute(source: Date, minute: number) {
  const next = new Date(source);
  next.setMinutes(minute);
  return next;
}

export function DateTimeWheelPicker({ name, label, value, onChange, actions }: DateTimeWheelPickerProps) {
  const selectedDate = useMemo(() => parseDateInput(value), [value]);
  const [dayAnchor] = useState(() => parseDateInput(value));
  const dayList = useMemo(() => buildDayList(dayAnchor), [dayAnchor]);

  const selectedDayIndex = useMemo(() => {
    const key = format(selectedDate, "yyyy-MM-dd");
    const index = dayList.findIndex((item) => item.key === key);
    return index >= 0 ? index : DAY_RANGE;
  }, [dayList, selectedDate]);

  const hourOptions = useMemo<WheelOption[]>(
    () => Array.from({ length: 24 }, (_, hour) => ({ label: String(hour).padStart(2, "0") })),
    [],
  );
  const minuteOptions = useMemo<WheelOption[]>(
    () => Array.from({ length: 60 }, (_, minute) => ({ label: String(minute).padStart(2, "0") })),
    [],
  );
  const secondOptions = useMemo<WheelOption[]>(
    () => Array.from({ length: 60 }, (_, second) => ({ label: String(second).padStart(2, "0") })),
    [],
  );

  function updateValue(nextDate: Date) {
    nextDate.setMilliseconds(0);
    onChange(formatDateTimeInput(nextDate));
  }

  function handleDaySelect(index: number) {
    const day = dayList[index];
    if (!day) return;
    updateValue(replaceDatePart(selectedDate, day.day));
  }

  function handleHourSelect(index: number) {
    updateValue(replaceHour(selectedDate, index));
  }

  function handleMinuteSelect(index: number) {
    updateValue(replaceMinute(selectedDate, index));
  }

  function handleSecondSelect(index: number) {
    const nextDate = new Date(selectedDate);
    nextDate.setSeconds(index, 0);
    updateValue(nextDate);
  }

  return (
    <div className="up-soft-panel up-datetime-picker border-[#e9eef6] bg-[#fbfdff] p-2.5">
      <div className="mb-2 flex items-center justify-between text-sm text-[#74839a]">
        <span>{label}</span>
        {actions}
      </div>

      <div className="up-soft-panel up-datetime-date-row rounded-xl bg-[#f4f8fd] p-1.5">
        <WheelColumn
          ariaLabel={`${label}-日期`}
          options={dayList}
          selectedIndex={selectedDayIndex}
          onSelect={handleDaySelect}
          horizontal
        />
      </div>

      <div className="up-soft-panel up-datetime-picker-grid mt-1.5 grid grid-cols-3 gap-1.5 rounded-xl bg-[#f4f8fd] p-1.5">
        <WheelColumn
          ariaLabel={`${label}-小时`}
          options={hourOptions}
          selectedIndex={selectedDate.getHours()}
          onSelect={handleHourSelect}
        />
        <WheelColumn
          ariaLabel={`${label}-分钟`}
          options={minuteOptions}
          selectedIndex={selectedDate.getMinutes()}
          onSelect={handleMinuteSelect}
        />
        <WheelColumn
          ariaLabel={`${label}-秒`}
          options={secondOptions}
          selectedIndex={selectedDate.getSeconds()}
          onSelect={handleSecondSelect}
        />
      </div>

      <input type="hidden" name={name} value={value} />
    </div>
  );
}
