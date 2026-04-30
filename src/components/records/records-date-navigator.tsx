"use client";

import { addDays, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, parseISO, startOfDay, startOfMonth, startOfWeek } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { IconifyIcon } from "@/components/ui/iconify-icon";

type RecordsDateNavigatorProps = {
  dateValue: string;
  embedded?: boolean;
};

function toDate(value: string): Date {
  try {
    const parsed = parseISO(`${value}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
      return new Date();
    }
    return parsed;
  } catch {
    return new Date();
  }
}

export function RecordsDateNavigator({ dateValue, embedded = false }: RecordsDateNavigatorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [panelMounted, setPanelMounted] = useState(false);
  const [viewMonth, setViewMonth] = useState(startOfDay(new Date()));

  const currentDate = useMemo(() => toDate(dateValue), [dateValue]);
  const displayLabel = useMemo(() => format(currentDate, "MM月dd日 EEEE"), [currentDate]);
  const today = startOfDay(new Date());
  const monthRows = useMemo(() => {
    const monthStart = startOfMonth(viewMonth);
    const monthEnd = endOfMonth(viewMonth);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const rows: Date[][] = [];

    let cursor = gridStart;
    while (cursor <= gridEnd) {
      const row: Date[] = [];
      for (let i = 0; i < 7; i += 1) {
        row.push(cursor);
        cursor = addDays(cursor, 1);
      }
      rows.push(row);
    }
    return rows;
  }, [viewMonth]);

  useEffect(() => {
    if (!panelMounted) return;
    function handleOutsidePointer(event: PointerEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    window.addEventListener("pointerdown", handleOutsidePointer);
    return () => window.removeEventListener("pointerdown", handleOutsidePointer);
  }, [panelMounted]);

  useEffect(() => {
    if (open || !panelMounted) return;
    const timer = window.setTimeout(() => setPanelMounted(false), 240);
    return () => window.clearTimeout(timer);
  }, [open, panelMounted]);

  function pushWithTransition(href: string) {
    const doc = document as Document & { startViewTransition?: (update: () => void) => void };
    if (doc.startViewTransition) {
      doc.startViewTransition(() => {
        router.push(href);
      });
      return;
    }
    router.push(href);
  }

  function goToDate(nextDate: Date) {
    const next = format(nextDate, "yyyy-MM-dd");
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", next);
    params.delete("backfill");
    params.delete("error");
    params.delete("success");
    params.delete("delta");
    params.delete("balance");

    pushWithTransition(`/records?${params.toString()}`);
  }

  function handlePrevDay() {
    goToDate(addDays(currentDate, -1));
  }

  function handleNextDay() {
    goToDate(addDays(currentDate, 1));
  }

  function handleTogglePicker() {
    if (!panelMounted) {
      setViewMonth(startOfDay(currentDate));
      setPanelMounted(true);
      window.requestAnimationFrame(() => setOpen(true));
      return;
    }
    if (open) {
      closePicker();
      return;
    }
    setOpen(true);
  }

  function closePicker() {
    setOpen(false);
  }

  return (
    <div
      ref={containerRef}
      className={`${embedded ? "relative flex flex-1 items-center gap-2" : "relative up-card flex items-center gap-2 px-3 py-2"}`}
    >
      <button
        type="button"
        onMouseDown={handlePrevDay}
        className="up-ghost-icon-btn cursor-pointer"
        aria-label="前一天"
      >
        <IconifyIcon icon="solar:alt-arrow-left-outline" className="up-icon up-icon-md" />
      </button>

      <button
        type="button"
        onMouseDown={handleTogglePicker}
        className={`${embedded ? "up-pill up-text-primary flex-1 text-center text-sm font-semibold cursor-pointer" : "up-pill up-text-primary flex-1 text-center text-sm font-semibold"}`}
      >
        {displayLabel}
      </button>

      <button
        type="button"
        onMouseDown={handleNextDay}
        className="up-ghost-icon-btn cursor-pointer"
        aria-label="后一天"
      >
        <IconifyIcon icon="solar:alt-arrow-right-outline" className="up-icon up-icon-md" />
      </button>

      {panelMounted ? (
        <div
          ref={panelRef}
          className={`up-overlay-surface up-popover-transition absolute left-2 right-2 top-[68px] z-[80] rounded-2xl p-3 ${
            open ? "up-popover-open" : "up-popover-closed"
          }`}
        >
          <div className="mb-2 flex items-center justify-between">
            <button type="button" className="text-[#97a7be]" onClick={() => setViewMonth((m) => addDays(startOfMonth(m), -1))}>
              <IconifyIcon icon="solar:alt-arrow-up-outline" className="up-icon up-icon-lg" />
            </button>
            <p className="text-lg font-semibold text-[#2e3f59]">{format(viewMonth, "yyyy年MM月")}</p>
            <button type="button" className="text-[#97a7be]" onClick={() => setViewMonth((m) => addDays(endOfMonth(m), 1))}>
              <IconifyIcon icon="solar:alt-arrow-down-outline" className="up-icon up-icon-lg" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-y-1 text-center text-sm text-[#40526d]">
            {["一", "二", "三", "四", "五", "六", "日"].map((dayName) => (
              <span key={dayName}>{dayName}</span>
            ))}
            {monthRows.map((row) =>
              row.map((day) => {
                const isCurrentMonth = isSameMonth(day, viewMonth);
                const isSelected = isSameDay(day, currentDate);
                const isToday = isSameDay(day, today);
                return (
                  <button
                    key={format(day, "yyyy-MM-dd")}
                    type="button"
                    onClick={() => {
                      goToDate(day);
                      closePicker();
                    }}
                    className={`rounded-md py-1 text-base ${!isCurrentMonth
                      ? "text-[#a8b2c0]"
                      : isSelected
                        ? "bg-[#2a9df4] text-white"
                        : "text-[#1f2e45]"
                      } ${isToday && !isSelected ? "ring-1 ring-[#a8c5e8]" : ""}`}
                  >
                    {format(day, "d")}
                  </button>
                );
              }),
            )}
          </div>

          <div className="mt-3 flex items-center justify-between text-lg">
            <button
              type="button"
              className="text-[#2a9df4]"
              onClick={() => {
                goToDate(today);
                closePicker();
              }}
            >
              今天
            </button>
            <button type="button" className="text-[#2a9df4]" onClick={closePicker}>
              关闭
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
