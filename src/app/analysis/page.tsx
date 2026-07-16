import Link from "next/link";
import { addDays, addMonths, format, max, min, startOfDay, startOfMonth } from "date-fns";

import { AnalysisRangePicker } from "@/components/analysis/analysis-range-picker";
import { SectionCard } from "@/components/ui/section-card";
import { requireUserId } from "@/lib/auth-guard";
import { DELETED_ACTIVITY_NAME } from "@/lib/constants";
import { decimalToNumber } from "@/lib/utils";
import { recordRepository } from "@/modules/record/record.repository";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type Period = "day" | "week" | "month";
type BlockState = "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "EMPTY";

function formatMinutesLabel(minutes: number) {
  if (minutes < 60) return `${minutes} 分`;
  return `${(minutes / 60).toFixed(1)} h`;
}

function formatRankingDuration(minutes: number) {
  if (minutes < 60) return `${minutes} 分`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes ? `${hours} 小时 ${remainingMinutes} 分钟` : `${hours} 小时`;
}

function periodLabel(period: Period) {
  if (period === "day") return "今日";
  if (period === "week") return "近7天";
  return "本月";
}

function formatYmd(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function parseYmd(value: string | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return startOfDay(parsed);
}

function getIsoWeekMonday(year: number, week: number): Date {
  const jan4 = startOfDay(new Date(year, 0, 4));
  const jan4Weekday = (jan4.getDay() + 6) % 7; // 0=Mon ... 6=Sun
  const firstMonday = addDays(jan4, -jan4Weekday);
  return addDays(firstMonday, (week - 1) * 7);
}

function parseWeekParam(value: string | undefined): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-W(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const week = Number(match[2]);
  if (!Number.isInteger(year) || !Number.isInteger(week) || week < 1 || week > 53) return null;
  const monday = getIsoWeekMonday(year, week);
  return startOfDay(monday);
}

function parseMonthParam(value: string | undefined): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) return null;
  return startOfMonth(new Date(year, month - 1, 1));
}

function getWeekInputValue(monday: Date): string {
  const thursday = addDays(monday, 3);
  const isoYear = thursday.getFullYear();
  const firstThursday = new Date(isoYear, 0, 4);
  const firstThursdayWeekday = (firstThursday.getDay() + 6) % 7;
  const weekOneMonday = addDays(startOfDay(firstThursday), -firstThursdayWeekday);
  const diffWeeks = Math.floor((monday.getTime() - weekOneMonday.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
  return `${isoYear}-W${String(diffWeeks).padStart(2, "0")}`;
}

function buildDayDistribution(
  dayStart: Date,
  dayRecords: Array<{
    startAt: Date;
    endAt: Date;
    activityNatureSnapshot: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
  }>,
) {
  const minutesPerBlock = 5;
  const blocksPerHour = 12;
  const rows: BlockState[][] = [];

  for (let hour = 0; hour < 24; hour += 1) {
    const hourBlocks: BlockState[] = [];
    for (let block = 0; block < blocksPerHour; block += 1) {
      const blockStart = addDays(dayStart, 0);
      blockStart.setHours(hour, block * minutesPerBlock, 0, 0);
      const blockEnd = new Date(blockStart.getTime() + minutesPerBlock * 60 * 1000);

      const score = {
        POSITIVE: 0,
        NEUTRAL: 0,
        NEGATIVE: 0,
      };

      for (const record of dayRecords) {
        const overlapStart = max([blockStart, record.startAt]);
        const overlapEnd = min([blockEnd, record.endAt]);
        const overlapMs = overlapEnd.getTime() - overlapStart.getTime();
        if (overlapMs <= 0) continue;
        score[record.activityNatureSnapshot] += overlapMs;
      }

      if (score.POSITIVE === 0 && score.NEUTRAL === 0 && score.NEGATIVE === 0) {
        hourBlocks.push("EMPTY");
      } else if (score.NEUTRAL >= score.POSITIVE && score.NEUTRAL >= score.NEGATIVE) {
        hourBlocks.push("NEUTRAL");
      } else if (score.POSITIVE >= score.NEGATIVE) {
        hourBlocks.push("POSITIVE");
      } else {
        hourBlocks.push("NEGATIVE");
      }
    }
    rows.push(hourBlocks);
  }

  return rows;
}

export default async function AnalysisPage({ searchParams }: PageProps) {
  const userId = await requireUserId();
  const params = (await searchParams) ?? {};
  const periodParam = typeof params.period === "string" ? params.period : "month";
  const period: Period = periodParam === "day" || periodParam === "week" ? periodParam : "month";

  const now = new Date();
  const today = startOfDay(now);
  const monthStart = startOfMonth(now);
  const selectedDay =
    period === "day" ? parseYmd(typeof params.day === "string" ? params.day : undefined) ?? today : today;
  const defaultWeekMonday = (() => {
    const weekday = (today.getDay() + 6) % 7;
    return addDays(today, -weekday);
  })();
  const selectedWeekMonday =
    period === "week"
      ? parseWeekParam(typeof params.week === "string" ? params.week : undefined) ?? defaultWeekMonday
      : defaultWeekMonday;
  const selectedMonth =
    period === "month"
      ? parseMonthParam(typeof params.month === "string" ? params.month : undefined) ?? monthStart
      : monthStart;

  const rangeStart =
    period === "day" ? selectedDay : period === "week" ? selectedWeekMonday : selectedMonth;
  const isCurrentMonth = selectedMonth.getFullYear() === today.getFullYear() && selectedMonth.getMonth() === today.getMonth();
  const rangeEnd =
    period === "day"
      ? addDays(rangeStart, 1)
      : period === "week"
        ? addDays(rangeStart, 7)
        : isCurrentMonth
          ? addDays(today, 1)
          : addMonths(selectedMonth, 1);

  const dayValue = formatYmd(selectedDay);
  const weekValue = getWeekInputValue(selectedWeekMonday);
  const prevDay = formatYmd(addDays(selectedDay, -1));
  const nextDay = formatYmd(addDays(selectedDay, 1));
  const prevWeek = getWeekInputValue(addDays(selectedWeekMonday, -7));
  const nextWeek = getWeekInputValue(addDays(selectedWeekMonday, 7));
  const monthValue = format(selectedMonth, "yyyy-MM");
  const prevMonth = format(addMonths(selectedMonth, -1), "yyyy-MM");
  const nextMonth = format(addMonths(selectedMonth, 1), "yyyy-MM");
  const weekRangeText = `${format(selectedWeekMonday, "MM/dd")} - ${format(addDays(selectedWeekMonday, 6), "MM/dd")}`;
  const dayRangeText = `${format(selectedDay, "MM/dd")} - ${format(selectedDay, "MM/dd")}`;
  const monthRangeText = `${format(selectedMonth, "MM/dd")} - ${format(addDays(rangeEnd, -1), "MM/dd")}`;
  const activeRangeText = period === "day" ? dayRangeText : period === "week" ? weekRangeText : monthRangeText;

  const dayStart = startOfDay(addDays(rangeEnd, -1));
  const dayEnd = addDays(dayStart, 1);

  const [periodRecords, dayRecords] = await Promise.all([
    recordRepository.listByRange(userId, rangeStart, rangeEnd),
    recordRepository.listByRange(userId, dayStart, dayEnd),
  ]);

  const minutesByNature = {
    POSITIVE: 0,
    NEUTRAL: 0,
    NEGATIVE: 0,
  };
  const rankingMap = new Map<string, { minutes: number; point: number }>();
  let earned = 0;
  let lost = 0;

  for (const record of periodRecords) {
    minutesByNature[record.activityNatureSnapshot] += record.durationMinutes;
    const activityName = record.activity.isEnabled ? record.activityNameSnapshot : DELETED_ACTIVITY_NAME;
    const current = rankingMap.get(activityName) ?? { minutes: 0, point: 0 };
    current.minutes += record.durationMinutes;
    current.point += decimalToNumber(record.pointDelta);
    rankingMap.set(activityName, current);

    const point = decimalToNumber(record.pointDelta);
    if (point >= 0) {
      earned += point;
    } else {
      lost += Math.abs(point);
    }
  }

  const totalMinutes = minutesByNature.POSITIVE + minutesByNature.NEUTRAL + minutesByNature.NEGATIVE;
  const positivePct = totalMinutes ? (minutesByNature.POSITIVE / totalMinutes) * 100 : 0;
  const neutralPct = totalMinutes ? (minutesByNature.NEUTRAL / totalMinutes) * 100 : 0;
  const negativePct = totalMinutes ? (minutesByNature.NEGATIVE / totalMinutes) * 100 : 0;
  const net = earned - lost;

  const ranking = [...rankingMap.entries()]
    .map(([name, value]) => ({ name, ...value }))
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, 8);

  const timeBlocks = buildDayDistribution(dayStart, dayRecords);
  const weekDays =
    period === "week"
      ? Array.from({ length: 7 }, (_, idx) => addDays(rangeStart, idx))
      : [];

  const weekDayStats = weekDays.map((day) => {
    const currentDayStart = startOfDay(day);
    const currentDayEnd = addDays(currentDayStart, 1);
    let positive = 0;
    let neutral = 0;
    let negative = 0;

    for (const record of periodRecords) {
      const overlapStart = max([currentDayStart, record.startAt]);
      const overlapEnd = min([currentDayEnd, record.endAt]);
      const overlapMinutes = Math.max(0, Math.floor((overlapEnd.getTime() - overlapStart.getTime()) / 60000));
      if (!overlapMinutes) continue;

      if (record.activityNatureSnapshot === "POSITIVE") positive += overlapMinutes;
      if (record.activityNatureSnapshot === "NEUTRAL") neutral += overlapMinutes;
      if (record.activityNatureSnapshot === "NEGATIVE") negative += overlapMinutes;
    }

    return {
      day,
      positive,
      neutral,
      negative,
      total: positive + neutral + negative,
    };
  });

  const weekHourGrid: BlockState[][] =
    period === "week"
      ? Array.from({ length: 24 }, (_, hour) =>
          weekDays.map((day) => {
            const hourStart = new Date(day);
            hourStart.setHours(hour, 0, 0, 0);
            const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);
            const score = { POSITIVE: 0, NEUTRAL: 0, NEGATIVE: 0 };

            for (const record of periodRecords) {
              const overlapStart = max([hourStart, record.startAt]);
              const overlapEnd = min([hourEnd, record.endAt]);
              const overlapMs = overlapEnd.getTime() - overlapStart.getTime();
              if (overlapMs <= 0) continue;
              score[record.activityNatureSnapshot] += overlapMs;
            }

            if (score.POSITIVE === 0 && score.NEUTRAL === 0 && score.NEGATIVE === 0) return "EMPTY";
            if (score.NEUTRAL >= score.POSITIVE && score.NEUTRAL >= score.NEGATIVE) return "NEUTRAL";
            if (score.POSITIVE >= score.NEGATIVE) return "POSITIVE";
            return "NEGATIVE";
          }),
        )
      : [];

  const weekActivityMap = new Map<string, number[]>();
  if (period === "week") {
    for (const record of periodRecords) {
      const dayIndex = weekDays.findIndex((day) => formatYmd(day) === formatYmd(record.startAt));
      if (dayIndex < 0) continue;
      const activityName = record.activity.isEnabled ? record.activityNameSnapshot : DELETED_ACTIVITY_NAME;
      const arr = weekActivityMap.get(activityName) ?? Array(7).fill(0);
      arr[dayIndex] += record.durationMinutes;
      weekActivityMap.set(activityName, arr);
    }
  }

  const weekActivities = [...weekActivityMap.entries()]
    .map(([name, byDay]) => ({
      name,
      byDay,
      total: byDay.reduce((sum, val) => sum + val, 0),
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 3);

  const weekMaxTotal = Math.max(1, ...weekDayStats.map((item) => item.total));
  const trendPoints =
    period === "week"
      ? weekDayStats.map((item, idx) => {
          const x = 16 + idx * 44;
          const y = 124 - (item.total / weekMaxTotal) * 104;
          return { x, y, total: item.total, day: item.day };
        })
      : [];
  const trendMaxPoint =
    trendPoints.length > 0 ? trendPoints.reduce((maxPoint, p) => (p.total > maxPoint.total ? p : maxPoint), trendPoints[0]) : null;

  return (
    <div className="space-y-3">
      <header className="up-card up-page-header">
        <h1 className="up-page-title up-header-center-title">分析</h1>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm up-page-meta">{periodLabel(period)}</span>
      </header>

      <section className="up-card p-2">
        <div className="up-segmented grid grid-cols-3 text-sm">
          <Link
            href={`/analysis?period=day&day=${dayValue}`}
            className={`up-segmented-btn py-2 ${period === "day" ? "is-active" : ""}`}
          >
            日
          </Link>
          <Link
            href={`/analysis?period=week&week=${weekValue}`}
            className={`up-segmented-btn py-2 ${period === "week" ? "is-active" : ""}`}
          >
            周
          </Link>
          <Link
            href="/analysis?period=month"
            className={`up-segmented-btn py-2 ${period === "month" ? "is-active" : ""}`}
          >
            月
          </Link>
        </div>
      </section>

      {period === "day" ? (
        <AnalysisRangePicker
          mode="day"
          dayValue={dayValue}
          dayLabel={format(selectedDay, "yyyy年MM月dd日")}
          prevDay={prevDay}
          nextDay={nextDay}
        />
      ) : null}

      {period === "week" ? (
        <AnalysisRangePicker
          mode="week"
          weekValue={weekValue}
          weekLabel={`${format(selectedWeekMonday, "yyyy")} 第${weekValue.split("-W")[1]}周`}
          prevWeek={prevWeek}
          nextWeek={nextWeek}
          weekRangeText={weekRangeText}
        />
      ) : null}

      {period === "month" ? (
        <AnalysisRangePicker
          mode="month"
          monthValue={monthValue}
          monthLabel={format(selectedMonth, "yyyy年MM月")}
          prevMonth={prevMonth}
          nextMonth={nextMonth}
        />
      ) : null}

      <SectionCard title="时间占比" description={activeRangeText}>
        <div className="flex items-center gap-3">
          <div
            className="grid size-36 place-items-center rounded-full"
            style={{
              background: `conic-gradient(#88d16c 0 ${positivePct}%, #2a9df4 ${positivePct}% ${
                positivePct + neutralPct
              }%, #f3b35a ${positivePct + neutralPct}% 100%)`,
            }}
          >
            <div className="grid size-25 place-items-center rounded-full bg-white text-center">
              <p className="text-xs text-[#9aa5b8]">总时长</p>
              <p className="text-lg font-semibold text-[#2f4059]">{formatMinutesLabel(totalMinutes)}</p>
            </div>
          </div>
          <div className="flex-1 space-y-2 text-sm">
            <div className="rounded-xl bg-[#eef9ec] px-3 py-2 text-[#53a65e]">
              积极 {minutesByNature.POSITIVE} 分 ({positivePct.toFixed(0)}%)
            </div>
            <div className="rounded-xl bg-[#edf6ff] px-3 py-2 text-[#2a9df4]">
              普通 {minutesByNature.NEUTRAL} 分 ({neutralPct.toFixed(0)}%)
            </div>
            <div className="rounded-xl bg-[#fff6eb] px-3 py-2 text-[#d98a2c]">
              消极 {minutesByNature.NEGATIVE} 分 ({negativePct.toFixed(0)}%)
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="活动排行" description="按时长排序">
        <div className="space-y-2 text-sm">
          {ranking.map((item) => {
            const width = totalMinutes ? Math.max(8, (item.minutes / totalMinutes) * 100) : 8;
            return (
              <div key={item.name} className="rounded-xl border border-[#edf2f8] bg-[#fbfdff] px-3 py-2">
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-medium text-[#4b5872]">{item.name}</span>
                  <span className="text-[#98a1b3]">{formatRankingDuration(item.minutes)}</span>
                </div>
                <div className="h-2 rounded-full bg-[#edf3fb]">
                  <div className="h-2 rounded-full bg-[#49b36a]" style={{ width: `${Math.min(100, width)}%` }} />
                </div>
              </div>
            );
          })}
          {!ranking.length ? <p className="py-4 text-center text-[#98a1b3]">当前周期暂无记录</p> : null}
        </div>
      </SectionCard>

      {period === "week" ? (
        <>
          <SectionCard title="时间统计" description="本周每天时长">
            <div className="grid grid-cols-7 items-end gap-2">
              {weekDayStats.map((item) => {
                const p = item.total ? (item.positive / item.total) * 100 : 0;
                const n = item.total ? (item.neutral / item.total) * 100 : 0;
                const g = item.total ? (item.negative / item.total) * 100 : 0;

                return (
                  <div key={formatYmd(item.day)} className="text-center">
                    <div className="mx-auto flex h-32 w-5 flex-col-reverse overflow-hidden rounded-full bg-[#edf2f8]">
                      <span className="bg-[#9eaab4]" style={{ height: `${g}%` }} />
                      <span className="bg-[#68c2c0]" style={{ height: `${n}%` }} />
                      <span className="bg-[#a7ca79]" style={{ height: `${p}%` }} />
                    </div>
                    <p className="mt-1 text-[11px] text-[#8e9bb0]">{format(item.day, "E")}</p>
                    <p className="text-[10px] text-[#a2acbc]">{item.total}分</p>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard title="时间分布" description="小时分布 x 7天">
            <div className="grid grid-cols-[20px_repeat(7,minmax(0,1fr))] gap-1 text-[10px] text-[#9aa7ba]">
              <span />
              {weekDays.map((day) => (
                <span key={formatYmd(day)} className="text-center">
                  {format(day, "E")}
                </span>
              ))}
            </div>
            <div className="mt-1 space-y-[2px]">
              {weekHourGrid.map((row, hour) => (
                <div key={hour} className="grid grid-cols-[20px_repeat(7,minmax(0,1fr))] gap-1 items-center">
                  <span className="text-[10px] text-[#9aa7ba]">{hour}</span>
                  {row.map((cell, idx) => {
                    const cellColor =
                      cell === "POSITIVE"
                        ? "bg-[#a7ca79]"
                        : cell === "NEUTRAL"
                          ? "bg-[#68c2c0]"
                          : cell === "NEGATIVE"
                            ? "bg-[#9eaab4]"
                            : "bg-[#e6ebf2]";
                    return <span key={`${hour}-${idx}`} className={`h-3 rounded-sm ${cellColor}`} />;
                  })}
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="活动统计" description="周内高频活动">
            <div className="grid grid-cols-3 gap-3 items-end">
              {weekActivities.map((activity) => {
                const maxActivityTotal = Math.max(1, ...weekActivities.map((it) => it.total));
                const h = Math.max(20, (activity.total / maxActivityTotal) * 150);
                return (
                  <div key={activity.name} className="text-center">
                    <div className="mx-auto flex w-9 flex-col-reverse overflow-hidden rounded-t-md bg-[#edf2f8]" style={{ height: `${h}px` }}>
                      {activity.byDay.map((val, idx) => (
                        <span
                          key={`${activity.name}-${idx}`}
                          className={idx % 2 === 0 ? "bg-[#68c2c0]" : "bg-[#a7ca79]"}
                          style={{ height: `${Math.max(0, (val / Math.max(1, activity.total)) * 100)}%` }}
                        />
                      ))}
                    </div>
                    <p className="mt-1 truncate text-xs text-[#71809a]">{activity.name}</p>
                    <p className="text-[10px] text-[#9aa7ba]">{activity.total}分</p>
                  </div>
                );
              })}
            </div>
            {!weekActivities.length ? <p className="py-4 text-center text-sm text-[#98a1b3]">本周暂无活动数据</p> : null}
          </SectionCard>

          <SectionCard title="活动趋势图" description="近7天总时长趋势">
            {trendPoints.length ? (
              <div className="relative rounded-2xl bg-[#f7fafc] p-3">
                <svg viewBox="0 0 300 130" className="w-full">
                  <polyline
                    fill="none"
                    stroke="#63c1be"
                    strokeWidth="3"
                    points={trendPoints.map((p) => `${p.x},${p.y}`).join(" ")}
                  />
                  {trendPoints.map((p) => (
                    <circle key={`${p.x}-${p.y}`} cx={p.x} cy={p.y} r="3" fill="#2a9df4" />
                  ))}
                </svg>
                {trendMaxPoint ? (
                  <div className="absolute right-3 top-3 rounded-xl bg-[#3f4b5f] px-3 py-2 text-xs text-white/90">
                    <p>{format(trendMaxPoint.day, "M/d EEEE")}</p>
                    <p>总时长 {trendMaxPoint.total} 分</p>
                  </div>
                ) : null}
                <div className="mt-1 grid grid-cols-7 text-center text-[10px] text-[#9aa7ba]">
                  {weekDays.map((day) => (
                    <span key={`x-${formatYmd(day)}`}>{format(day, "E")}</span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-[#98a1b3]">本周暂无趋势数据</p>
            )}
          </SectionCard>
        </>
      ) : (
        <SectionCard title="时间分布" description="每块代表 5 分钟">
          <div className="rounded-2xl bg-[#f3f6fa] px-2.5 py-2.5">
            <div className="space-y-1">
              {timeBlocks.map((hourBlocks, hour) => (
                <div key={hour} className="grid grid-cols-[24px_1fr] items-center gap-2">
                  <span className="text-right text-xs text-[#9aa1a5]">{hour}</span>
                  <div className="grid grid-cols-12 gap-[2px] rounded-[8px] bg-[#e2e8ee] p-[2px]">
                    {hourBlocks.map((block, idx) => {
                      const color =
                        block === "NEUTRAL"
                          ? "bg-[#68c2c0]"
                          : block === "POSITIVE"
                            ? "bg-[#a7ca79]"
                            : block === "NEGATIVE"
                              ? "bg-[#9eaab4]"
                              : "bg-[#cfd6dd]";
                      return <span key={`${hour}-${idx}`} className={`h-4 rounded-[5px] ${color}`} aria-hidden />;
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      )}
      <SectionCard title="积分统计" description={periodLabel(period)}>
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div className="rounded-2xl bg-[#edf8ee] px-2 py-3">
            <p className="text-xs text-[#8ea4bf]">获得</p>
            <p className="mt-1 font-semibold text-[#53a65e]">+{earned.toFixed(2)}</p>
          </div>
          <div className="rounded-2xl bg-[#fff6eb] px-2 py-3">
            <p className="text-xs text-[#8ea4bf]">失去</p>
            <p className="mt-1 font-semibold text-[#d98a2c]">-{lost.toFixed(2)}</p>
          </div>
          <div className="rounded-2xl bg-[#eff8ff] px-2 py-3">
            <p className="text-xs text-[#8ea4bf]">净值</p>
            <p className="mt-1 font-semibold text-[#2a9df4]">{net >= 0 ? "+" : ""}{net.toFixed(2)}</p>
          </div>
        </div>
      </SectionCard>
      <div className="mb-4"></div>
    </div>
  );
}
