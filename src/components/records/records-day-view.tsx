"use client";

import { isSameDay, parseISO } from "date-fns";
import { useMemo, useState } from "react";

import { IconifyIcon } from "@/components/ui/iconify-icon";

type TimelineRecord = {
  id: string;
  activityId: string;
  activityNameSnapshot: string;
  activityNatureSnapshot: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
  note: string | null;
  startAt: string;
  endAt: string;
  durationMinutes: number;
  pointDelta: number;
};

type RecordsDayViewProps = {
  dateValue: string;
  records: TimelineRecord[];
  onRecordClick?: (record: TimelineRecord) => void;
};

type HourRange = {
  startHour: number;
  endHour: number;
};

function parseDateSafe(value: string): Date {
  const parsed = parseISO(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }
  return parsed;
}

function minutesOfDay(value: Date): number {
  return value.getHours() * 60 + value.getMinutes();
}

function formatDurationMinutes(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h > 0 && m > 0) return `${h}时${m}分`;
  if (h > 0) return `${h}时`;
  return `${m}分`;
}

function rowToneClasses(nature: TimelineRecord["activityNatureSnapshot"]): string {
  if (nature === "POSITIVE") return "border-[#d9f1de] bg-[#edf8f0] text-[#4ba368]";
  if (nature === "NEGATIVE") return "border-[#f8ead8] bg-[#fff6ec] text-[#8f8f98]";
  return "border-[#ebeff6] bg-[#f7f9fd] text-[#7d8ca2]";
}

function resolveHourRange(records: TimelineRecord[], dateValue: string): HourRange {
  if (!records.length) {
    return { startHour: 8, endHour: 22 };
  }

  const starts = records.map((item) => minutesOfDay(parseDateSafe(item.startAt)));
  const ends = records.map((item) => minutesOfDay(parseDateSafe(item.endAt)));

  const baseMin = Math.min(...starts);
  const baseMax = Math.max(...ends);

  let startHour = Math.max(0, Math.floor(baseMin / 60));
  let endHour = Math.min(24, Math.ceil(baseMax / 60) + 1);

  const selected = parseDateSafe(`${dateValue}T00:00:00`);
  const now = new Date();
  if (isSameDay(selected, now)) {
    const nowHour = now.getHours();
    startHour = Math.min(startHour, Math.max(0, nowHour - 2));
    endHour = Math.max(endHour, Math.min(24, nowHour + 2));
  }

  if (endHour - startHour < 6) {
    const center = Math.floor((startHour + endHour) / 2);
    startHour = Math.max(0, center - 3);
    endHour = Math.min(24, startHour + 6);
  }

  return { startHour, endHour };
}

export function RecordsDayView({ dateValue, records, onRecordClick }: RecordsDayViewProps) {
  const [zoom, setZoom] = useState(64);

  const sortedRecords = useMemo(
    () => [...records].sort((a, b) => parseDateSafe(a.startAt).getTime() - parseDateSafe(b.startAt).getTime()),
    [records],
  );

  const range = useMemo(() => resolveHourRange(sortedRecords, dateValue), [sortedRecords, dateValue]);
  const hourCount = range.endHour - range.startHour;
  const chartHeight = hourCount * zoom;
  const baseMinute = range.startHour * 60;

  const selectedDate = parseDateSafe(`${dateValue}T00:00:00`);
  const now = new Date();
  const showNowMarker = isSameDay(selectedDate, now);
  const nowTop = ((minutesOfDay(now) - baseMinute) / 60) * zoom;

  function zoomOut() {
    setZoom((prev) => Math.max(44, prev - 10));
  }

  function zoomIn() {
    setZoom((prev) => Math.min(110, prev + 10));
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold text-[#2d6ba0]">日视图</p>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={zoomOut}
            className="up-ghost-icon-btn grid size-7 place-items-center text-xs"
            title="缩小"
          >
            <IconifyIcon icon="material-symbols:zoom-out" className="size-4" />
          </button>
          <button
            type="button"
            onClick={zoomIn}
            className="up-ghost-icon-btn grid size-7 place-items-center text-xs"
            title="放大"
          >
            <IconifyIcon icon="material-symbols:zoom-in" className="size-4" />
          </button>
        </div>
      </div>

      <div className="up-scrollbar min-h-0 flex-1 overflow-y-auto rounded-2xl border border-[#ebf1f8] bg-[#fbfdff] px-1 py-2">
        <div className="relative grid grid-cols-[52px_1fr] gap-1" style={{ minHeight: chartHeight }}>
          <div className="relative">
            {Array.from({ length: hourCount + 1 }, (_, index) => {
              const hour = range.startHour + index;
              const top = index * zoom;
              return (
                <span
                  key={hour}
                  className="absolute left-0 -translate-y-1/2 text-[13px] text-[#a2afc2]"
                  style={{ top }}
                >
                  {String(hour).padStart(2, "0")}:00
                </span>
              );
            })}
          </div>

          <div className="relative rounded-xl bg-[#f8fafd]">
            {Array.from({ length: hourCount + 1 }, (_, index) => (
              <div
                key={`line-${index}`}
                className="absolute left-0 right-0 border-t border-[#edf2f8]"
                style={{ top: index * zoom }}
              />
            ))}

            {sortedRecords.map((item) => {
              const start = parseDateSafe(item.startAt);
              const end = parseDateSafe(item.endAt);
              const startMinute = minutesOfDay(start);
              const endMinute = Math.max(startMinute + 1, minutesOfDay(end));

              const top = ((startMinute - baseMinute) / 60) * zoom;
              const height = Math.max(((endMinute - startMinute) / 60) * zoom, 24);

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onRecordClick?.(item)}
                  className={`absolute left-1 right-1 rounded-xl border px-2 py-1 text-left ${rowToneClasses(
                    item.activityNatureSnapshot,
                  )}`}
                  style={{ top, height }}
                >
                  <p className="truncate text-sm font-semibold">
                    {item.activityNameSnapshot} {formatDurationMinutes(item.durationMinutes)}
                  </p>
                  {item.note ? <p className="truncate text-[11px] text-[#9aa8bb]">{item.note}</p> : null}
                </button>
              );
            })}

            {showNowMarker && nowTop >= 0 && nowTop <= chartHeight ? (
              <div className="absolute left-0 right-0 z-10 border-t border-dashed border-[#40a0f2]" style={{ top: nowTop }} />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
