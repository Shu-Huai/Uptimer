"use client";

import { format, parseISO } from "date-fns";
import { useMemo, useState } from "react";

import { BackfillSheetForm } from "@/components/records/backfill-sheet-form";
import { RecordsDateNavigator } from "@/components/records/records-date-navigator";
import { RecordsDayView } from "@/components/records/records-day-view";
import { IconifyIcon } from "@/components/ui/iconify-icon";

type ActivityOption = {
  id: string;
  name: string;
  icon: string | null;
  nature: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
};

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

type TimelineGap = {
  id: string;
  startAt: string;
  endAt: string;
  durationMinutes: number;
};

type DaySummary = {
  durationMinutes: number;
  earned: number;
  lost: number;
  net: number;
};

type RecordsTimelineMobileProps = {
  dateValue: string;
  activities: ActivityOption[];
  records: TimelineRecord[];
  gaps: TimelineGap[];
  summary: DaySummary;
  defaultStart: string;
  defaultEnd: string;
  sheetError?: string;
  openDefault?: boolean;
};

type TimelineItem =
  | {
      type: "record";
      id: string;
      startTs: number;
      endTs: number;
      record: TimelineRecord;
    }
  | {
      type: "gap";
      id: string;
      startTs: number;
      endTs: number;
      gap: TimelineGap;
    };

const MIN_VISIBLE_GAP_MS = 60 * 1000;

function parseDateSafe(value: string): Date {
  const parsed = parseISO(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }
  return parsed;
}

function formatDurationSpan(startAt: string, endAt: string): string {
  const start = parseDateSafe(startAt);
  const end = parseDateSafe(endAt);
  const totalSec = Math.max(1, Math.floor((end.getTime() - start.getTime()) / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;

  if (h > 0) return `${h}时${m}分${s}秒`;
  if (m > 0) return `${m}分${s}秒`;
  return `${s}秒`;
}

function formatPoint(value: number): string {
  const abs = Math.abs(value);
  const normalized = Number(abs.toFixed(2)).toString();
  return `${value >= 0 ? "+" : "-"}${normalized}`;
}

function formatTimeShort(value: string): string {
  return format(parseDateSafe(value), "HH:mm");
}

function resolveRecordIcon(record: TimelineRecord, activities: ActivityOption[]): string {
  const byName = activities.find((item) => item.name === record.activityNameSnapshot);
  if (byName?.icon) {
    return byName.icon;
  }

  if (record.activityNatureSnapshot === "POSITIVE") return "material-symbols:menu-book-outline-rounded";
  if (record.activityNatureSnapshot === "NEGATIVE") return "material-symbols:phone-android-outline";
  return "material-symbols:schedule-outline";
}

function resolveRecordFallback(record: TimelineRecord): string {
  if (record.activityNatureSnapshot === "POSITIVE") return "material-symbols:menu-book-outline-rounded";
  if (record.activityNatureSnapshot === "NEGATIVE") return "material-symbols:phone-android-outline";
  return "material-symbols:schedule-outline";
}

function rowToneClasses(record: TimelineRecord): string {
  if (record.activityNatureSnapshot === "POSITIVE") {
    return "border-[#d8f1df] bg-[#f4fbf6]";
  }
  if (record.activityNatureSnapshot === "NEGATIVE") {
    return "border-[#f6e5cf] bg-[#fff8f0]";
  }
  return "border-[#e6edf7] bg-[#f7f9fd]";
}

export function RecordsTimelineMobile({
  dateValue,
  activities,
  records,
  gaps,
  summary,
  defaultStart,
  defaultEnd,
  sheetError,
  openDefault = false,
}: RecordsTimelineMobileProps) {
  const [open, setOpen] = useState(openDefault);
  const [sheetStart, setSheetStart] = useState(defaultStart);
  const [sheetEnd, setSheetEnd] = useState(defaultEnd);
  const [tab, setTab] = useState<"timeline" | "day">("timeline");

  const titleDate = useMemo(() => format(parseDateSafe(`${dateValue}T00:00:00`), "MM月dd日 EEEE"), [dateValue]);

  const items = useMemo<TimelineItem[]>(() => {
    const recordItems: TimelineItem[] = records.map((record) => ({
      type: "record",
      id: record.id,
      startTs: parseDateSafe(record.startAt).getTime(),
      endTs: parseDateSafe(record.endAt).getTime(),
      record,
    }));

    const gapItems: TimelineItem[] = gaps
      .map((gap) => ({
        type: "gap" as const,
        id: gap.id,
        startTs: parseDateSafe(gap.startAt).getTime(),
        endTs: parseDateSafe(gap.endAt).getTime(),
        gap,
      }))
      .filter((item) => item.endTs - item.startTs >= MIN_VISIBLE_GAP_MS);

    return [...recordItems, ...gapItems].sort((a, b) => b.startTs - a.startTs);
  }, [gaps, records]);

  function openBackfill(startAt: string, endAt: string) {
    setSheetStart(format(parseDateSafe(startAt), "yyyy-MM-dd'T'HH:mm"));
    setSheetEnd(format(parseDateSafe(endAt), "yyyy-MM-dd'T'HH:mm"));
    setOpen(true);
  }

  const [editingRecord, setEditingRecord] = useState<TimelineRecord | null>(null);

  function openEditRecord(record: TimelineRecord) {
    setEditingRecord(record);
    setOpen(false);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <header className="relative z-30 up-card flex items-center gap-2 px-3 py-2">
        <RecordsDateNavigator dateValue={dateValue} embedded />
      </header>

      <div className="up-card up-stat-grid">
        <div className="up-stat-cell">
          <p className="up-stat-value">{summary.durationMinutes}</p>
          <p className="up-stat-label">总计时</p>
        </div>
        <div className="up-stat-cell">
          <p className="up-stat-value is-positive">+{summary.earned.toFixed(2)}</p>
          <p className="up-stat-label">获得</p>
        </div>
        <div className="up-stat-cell">
          <p className="up-stat-value is-warning">-{summary.lost.toFixed(2)}</p>
          <p className="up-stat-label">失去</p>
        </div>
        <div className="up-stat-cell">
          <p className="up-stat-value is-primary">
            {summary.net >= 0 ? "+" : ""}
            {summary.net.toFixed(2)}
          </p>
          <p className="up-stat-label">结余</p>
        </div>
      </div>

      <section className="up-card flex min-h-0 flex-1 flex-col p-3">
        <div className="mb-3 flex items-center justify-between">
          <div className="up-segmented grid grid-cols-2">
            <button
              type="button"
              onClick={() => setTab("timeline")}
              className={`up-segmented-btn px-4 py-1.5 ${tab === "timeline" ? "is-active" : ""}`}
            >
              时间轴
            </button>
            <button
              type="button"
              onClick={() => setTab("day")}
              className={`up-segmented-btn px-4 py-1.5 ${tab === "day" ? "is-active" : ""}`}
            >
              日视图
            </button>
          </div>
        </div>

        <div
          className={`min-h-0 flex-1 pr-1 ${
            tab === "timeline" ? "up-scrollbar overflow-y-auto" : "overflow-hidden"
          }`}
        >
          <div key={tab} className="up-switch-fade h-full min-h-0">
            {tab === "timeline" ? (
              <>
              <p className="mb-3 text-center text-xl font-semibold  text-base ">{titleDate}</p>

              <div className="space-y-2">
                {items.map((item) =>
                  item.type === "gap" ? (
                    <div key={item.id} className="grid grid-cols-[52px_1fr] items-center gap-2">
                      <div className="text-center leading-tight">
                        <p className="text-sm text-[#7e8fa6]">{formatTimeShort(item.gap.startAt)}</p>
                        <p className="text-[11px] text-[#b1bdce]">{formatTimeShort(item.gap.endAt)}</p>
                      </div>
                      <div className="up-empty-state flex items-center justify-between border-[#d4e8ff] bg-[#f6fbff] px-3 py-2">
                        <p className="flex items-center gap-1 text-sm text-[#7791b2]">
                          <IconifyIcon icon="solar:question-circle-outline" className="up-icon up-icon-sm" />
                          空白: {formatDurationSpan(item.gap.startAt, item.gap.endAt)}
                        </p>
                        <button
                          type="button"
                          onClick={() => openBackfill(item.gap.startAt, item.gap.endAt)}
                          className="inline-flex size-7 items-center justify-center rounded-full bg-[#e8f4ff] text-[#2a9df4]"
                          aria-label="补记该空白时间段"
                        >
                          <IconifyIcon icon="material-symbols:add" className="up-icon up-icon-md" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div key={item.id} className="grid grid-cols-[52px_1fr] items-center gap-2">
                      <div className="text-center leading-tight">
                        <p className="text-sm text-[#7e8fa6]">{formatTimeShort(item.record.startAt)}</p>
                        <p className="text-[11px] text-[#b1bdce]">{formatTimeShort(item.record.endAt)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => openEditRecord(item.record)}
                        className={`grid w-full grid-cols-[1fr_auto_auto] items-center gap-2 rounded-2xl border px-3 py-2 text-left ${rowToneClasses(item.record)}`}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-base font-semibold text-[#39465f]">
                            <IconifyIcon
                              icon={resolveRecordIcon(item.record, activities)}
                              fallback={resolveRecordFallback(item.record)}
                              className="mr-1 inline-block size-4 align-[-2px]"
                            />
                            {item.record.activityNameSnapshot}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-[#7f8fa6]">
                            <IconifyIcon icon="solar:clock-circle-outline" className="up-icon up-icon-sm" />
                            {formatDurationSpan(item.record.startAt, item.record.endAt)}
                          </p>
                          {item.record.note ? <p className="mt-0.5 truncate text-[11px] text-[#95a4ba]">备注: {item.record.note}</p> : null}
                        </div>
                        {Math.abs(item.record.pointDelta) >= 0.005 ? (
                          <p className={`text-base font-semibold ${item.record.pointDelta >= 0 ? "text-[#4ab06e]" : "text-[#f39c44]"}`}>
                            {formatPoint(item.record.pointDelta)}
                          </p>
                        ) : (
                          <span className="w-2" />
                        )}
                      </button>
                    </div>
                  ),
                )}

                {!items.length ? (
                  <p className="up-empty-state py-10 text-center">当天暂无记录。</p>
                ) : null}
              </div>
              </>
            ) : (
              <RecordsDayView dateValue={dateValue} records={records} onRecordClick={openEditRecord} />
            )}
          </div>
        </div>
      </section>

      <button
        type="button"
        onClick={() => {
          setSheetStart(defaultStart);
          setSheetEnd(defaultEnd);
          setOpen(true);
        }}
        className="up-fab inline-flex items-center justify-center text-white"
        aria-label="补记"
        title="补记"
      >
        <IconifyIcon icon="material-symbols:add" className="up-icon size-10" />
      </button>

      {open ? (
        <BackfillSheetForm
          activities={activities}
          defaultStart={sheetStart}
          defaultEnd={sheetEnd}
          error={sheetError}
          returnDate={dateValue}
          onClose={() => setOpen(false)}
        />
      ) : null}

      {editingRecord ? (
        <BackfillSheetForm
          mode="edit"
          recordId={editingRecord.id}
          activities={activities}
          defaultStart={format(parseDateSafe(editingRecord.startAt), "yyyy-MM-dd'T'HH:mm")}
          defaultEnd={format(parseDateSafe(editingRecord.endAt), "yyyy-MM-dd'T'HH:mm")}
          defaultActivityId={editingRecord.activityId}
          defaultNote={editingRecord.note ?? ""}
          returnDate={dateValue}
          onClose={() => setEditingRecord(null)}
        />
      ) : null}
    </div>
  );
}
