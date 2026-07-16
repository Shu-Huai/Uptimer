"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { IconifyIcon } from "@/components/ui/iconify-icon";

type DayRangePickerProps = {
  mode: "day";
  dayValue: string;
  dayLabel: string;
  prevDay: string;
  nextDay: string;
};

type WeekRangePickerProps = {
  mode: "week";
  weekValue: string;
  weekLabel: string;
  prevWeek: string;
  nextWeek: string;
  weekRangeText: string;
};

type MonthRangePickerProps = {
  mode: "month";
  monthValue: string;
  monthLabel: string;
  prevMonth: string;
  nextMonth: string;
};

type AnalysisRangePickerProps = DayRangePickerProps | WeekRangePickerProps | MonthRangePickerProps;

function parseYmd(value: string): Date {
  return startOfDay(new Date(`${value}T00:00:00`));
}

function parseWeekValue(weekValue: string): Date {
  const match = /^(\d{4})-W(\d{2})$/.exec(weekValue);
  if (!match) return startOfDay(new Date());
  const year = Number(match[1]);
  const week = Number(match[2]);
  const jan4 = startOfDay(new Date(year, 0, 4));
  const jan4Weekday = (jan4.getDay() + 6) % 7;
  const firstMonday = addDays(jan4, -jan4Weekday);
  return addDays(firstMonday, (week - 1) * 7);
}

function parseMonthValue(monthValue: string): Date {
  const match = /^(\d{4})-(\d{2})$/.exec(monthValue);
  if (!match) return startOfMonth(new Date());
  return startOfMonth(new Date(Number(match[1]), Number(match[2]) - 1, 1));
}

function toWeekValue(monday: Date): string {
  return format(monday, "RRRR-'W'II");
}

function toYmd(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function buildMonthRows(anchorMonth: Date) {
  const monthStart = startOfMonth(anchorMonth);
  const monthEnd = endOfMonth(anchorMonth);
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
}

function weekIndexLabel(monday: Date) {
  return format(monday, "I");
}

export function AnalysisRangePicker(props: AnalysisRangePickerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [panelMounted, setPanelMounted] = useState(false);
  const containerRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const selectedDay = props.mode === "day" ? parseYmd(props.dayValue) : null;
  const selectedWeekMonday = props.mode === "week" ? parseWeekValue(props.weekValue) : null;
  const selectedMonth = props.mode === "month" ? parseMonthValue(props.monthValue) : null;
  const [viewMonth, setViewMonth] = useState<Date>(
    selectedDay ?? selectedWeekMonday ?? selectedMonth ?? startOfDay(new Date()),
  );

  useEffect(() => {
    if (!panelMounted) return;
    function handleOutsideClick(event: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    window.addEventListener("mousedown", handleOutsideClick);
    return () => window.removeEventListener("mousedown", handleOutsideClick);
  }, [panelMounted]);

  useEffect(() => {
    if (open || !panelMounted) return;
    const timer = window.setTimeout(() => setPanelMounted(false), 240);
    return () => window.clearTimeout(timer);
  }, [open, panelMounted]);

  const monthRows = useMemo(() => buildMonthRows(viewMonth), [viewMonth]);
  const today = startOfDay(new Date());

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

  function togglePanel() {
    if (!panelMounted) {
      setViewMonth(selectedDay ?? selectedWeekMonday ?? selectedMonth ?? startOfDay(new Date()));
      setPanelMounted(true);
      window.requestAnimationFrame(() => setOpen(true));
      return;
    }
    if (open) {
      closePanel();
      return;
    }
    setOpen(true);
  }

  function closePanel() {
    setOpen(false);
  }

  function handlePickDay(day: Date) {
    pushWithTransition(`/analysis?period=day&day=${toYmd(day)}`);
    closePanel();
  }

  function handlePickWeek(dayInWeek: Date) {
    const monday = startOfWeek(dayInWeek, { weekStartsOn: 1 });
    pushWithTransition(`/analysis?period=week&week=${toWeekValue(monday)}`);
    closePanel();
  }

  function handlePickMonth(dayInMonth: Date) {
    pushWithTransition(`/analysis?period=month&month=${format(dayInMonth, "yyyy-MM")}`);
    closePanel();
  }

  return (
    <section ref={containerRef} className={`relative up-card p-3 ${open ? "z-30" : "z-0"}`}>
      <div className="grid grid-cols-[86px_1fr_86px] items-center gap-2">
        <button
          type="button"
          className="up-secondary-btn px-3 py-2 text-sm"
          onClick={() =>
            pushWithTransition(
                props.mode === "day"
                  ? `/analysis?period=day&day=${props.prevDay}`
                  : props.mode === "week"
                    ? `/analysis?period=week&week=${props.prevWeek}`
                    : `/analysis?period=month&month=${props.prevMonth}`,
            )
          }
        >
          {props.mode === "day" ? "前一天" : props.mode === "week" ? "上一周" : "上个月"}
        </button>

        <button
          type="button"
          onClick={togglePanel}
          className="up-pill h-10 w-full text-sm font-semibold up-text-primary"
        >
          {props.mode === "day" ? props.dayLabel : props.mode === "week" ? props.weekLabel : props.monthLabel}
        </button>

        <button
          type="button"
          className="up-secondary-btn px-3 py-2 text-sm"
          onClick={() =>
            pushWithTransition(
                props.mode === "day"
                  ? `/analysis?period=day&day=${props.nextDay}`
                  : props.mode === "week"
                    ? `/analysis?period=week&week=${props.nextWeek}`
                    : `/analysis?period=month&month=${props.nextMonth}`,
            )
          }
        >
          {props.mode === "day" ? "后一天" : props.mode === "week" ? "下一周" : "下个月"}
        </button>
      </div>

      {props.mode === "week" ? (
        <p className="mt-2 text-center text-xs up-text-muted">本周范围：{props.weekRangeText}（周一到周日）</p>
      ) : null}

      {panelMounted ? (
        <div
          ref={panelRef}
          className={`up-overlay-surface up-popover-transition absolute left-3 right-3 z-[80] rounded-2xl p-3 ${
            open ? "up-popover-open" : "up-popover-closed"
          } ${
            props.mode === "week" ? "top-[84px]" : "top-[58px]"
          }`}
        >
          <div className="mb-2 flex items-center justify-between">
            <button type="button" className="text-[#97a7be]" onClick={() => setViewMonth((m) => addMonths(m, -1))}>
              <IconifyIcon icon="solar:alt-arrow-up-outline" className="up-icon up-icon-lg" />
            </button>
            <p className="text-lg font-semibold text-[#2e3f59]">{format(viewMonth, "yyyy年MM月")}</p>
            <button type="button" className="text-[#97a7be]" onClick={() => setViewMonth((m) => addMonths(m, 1))}>
              <IconifyIcon icon="solar:alt-arrow-down-outline" className="up-icon up-icon-lg" />
            </button>
          </div>

          <div className="grid grid-cols-[30px_repeat(7,minmax(0,1fr))] gap-y-1 text-center text-sm text-[#40526d]">
            <span className="text-[#9aa7ba]">周</span>
            {["一", "二", "三", "四", "五", "六", "日"].map((dayName) => (
              <span key={dayName}>{dayName}</span>
            ))}

            {monthRows.map((row) => {
              const monday = row[0];
              const isSelectedWeek =
                props.mode === "week" && selectedWeekMonday ? isSameDay(monday, selectedWeekMonday) : false;

              return (
                <div key={toYmd(monday)} className="contents">
                  <button
                    type="button"
                    onClick={() => (props.mode === "week" ? handlePickWeek(monday) : undefined)}
                    className={`rounded-md py-1 text-sm ${
                      isSelectedWeek ? "bg-[#2a9df4] text-white" : "text-[#5f718d]"
                    }`}
                  >
                    {weekIndexLabel(monday)}
                  </button>
                  {row.map((day) => {
                    const isCurrentMonth = isSameMonth(day, viewMonth);
                    const isToday = isSameDay(day, today);
                    const isSelectedDay =
                      props.mode === "day" && selectedDay ? isSameDay(day, selectedDay) : false;
                    const isInSelectedWeek =
                      props.mode === "week" && selectedWeekMonday
                        ? day >= selectedWeekMonday && day <= addDays(selectedWeekMonday, 6)
                        : false;
                    const isSelectedMonth =
                      props.mode === "month" && selectedMonth ? isSameMonth(day, selectedMonth) : false;

                    return (
                      <button
                        key={toYmd(day)}
                        type="button"
                        onClick={() =>
                          props.mode === "day"
                            ? handlePickDay(day)
                            : props.mode === "week"
                              ? handlePickWeek(day)
                              : handlePickMonth(day)
                        }
                        className={`rounded-md ml-1 py-1 text-base transition ${
                          !isCurrentMonth
                            ? "text-[#a8b2c0]"
                            : isSelectedDay
                              ? "bg-[#2a9df4] text-white"
                              : isInSelectedWeek
                                ? "bg-[#2a9df4] text-white"
                                : isSelectedMonth
                                  ? "bg-[#2a9df4] text-white"
                                : "text-[#1f2e45]"
                        } ${isToday && !isSelectedDay && !isInSelectedWeek && !isSelectedMonth ? "ring-1 ring-[#a8c5e8]" : ""}`}
                      >
                        {format(day, "d")}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between text-lg">
            <button
              type="button"
              className="text-[#2a9df4]"
              onClick={() => {
                if (props.mode === "day") {
                  pushWithTransition(`/analysis?period=day&day=${toYmd(today)}`);
                } else if (props.mode === "week") {
                  const monday = startOfWeek(today, { weekStartsOn: 1 });
                  pushWithTransition(`/analysis?period=week&week=${toWeekValue(monday)}`);
                } else {
                  pushWithTransition(`/analysis?period=month&month=${format(today, "yyyy-MM")}`);
                }
                closePanel();
              }}
            >
              {props.mode === "day" ? "今天" : props.mode === "week" ? "本周" : "本月"}
            </button>
            <button type="button" className="text-[#2a9df4]" onClick={closePanel}>
              关闭
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
