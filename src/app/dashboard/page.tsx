import Link from "next/link";
import { format } from "date-fns";

import { DashboardTimerActions } from "@/components/dashboard/dashboard-timer-actions";
import { IconifyIcon } from "@/components/ui/iconify-icon";
import { SectionCard } from "@/components/ui/section-card";
import { requireUserId } from "@/lib/auth-guard";
import { DELETED_ACTIVITY_NAME } from "@/lib/constants";
import { formatDay } from "@/lib/time";
import { decimalToNumber } from "@/lib/utils";
import { activityService } from "@/modules/activity/activity.service";
import { pointsService } from "@/modules/points/points.service";
import { recordService } from "@/modules/record/record.service";
import { timerService } from "@/modules/timer/timer.service";

async function loadDashboardData(userId: string) {
  try {
    const today = new Date();
    const [recordSummary, timeline, pointBalance, pointDaySummary, runningTimer, activities] = await Promise.all([
      recordService.getDaySummary(userId, today),
      recordService.listByDay(userId, today),
      pointsService.getBalance(userId),
      pointsService.getDaySummary(userId, today),
      timerService.getRunningTimer(userId),
      activityService.listEnabled(userId),
    ]);

    return {
      ok: true as const,
      recordSummary,
      timeline,
      pointBalance,
      pointDaySummary,
      runningTimer,
      activities,
      today,
    };
  } catch {
    return { ok: false as const };
  }
}

export default async function DashboardPage() {
  const userId = await requireUserId();
  const data = await loadDashboardData(userId);

  if (!data.ok) {
    return (
      <div className="up-card border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        数据尚未初始化，请先执行 migration 和 seed 后再查看仪表盘。
      </div>
    );
  }

  const todayLabel = format(data.today, "MM月dd日 EEEE");
  const todayDate = formatDay(data.today);

  const timelineItems = [
    ...data.timeline.records.map((item) => ({
      type: "record" as const,
      id: item.id,
      startAt: item.startAt,
      endAt: item.endAt,
      record: item,
    })),
    ...data.timeline.gaps.map((gap) => ({
      type: "gap" as const,
      id: `${gap.startAt.toISOString()}-${gap.endAt.toISOString()}`,
      startAt: gap.startAt,
      endAt: gap.endAt,
      gap,
    })),
  ].sort((a, b) => a.startAt.getTime() - b.startAt.getTime());

  return (
    <div className="space-y-3 pb-10">
      <header className="up-card up-page-header">
        <div className="up-header-center-title up-pill min-w-52 text-center text-sm font-semibold up-text-primary">
          {todayLabel}
        </div>
      </header>

      <div className="up-card up-stat-grid">
        <div className="up-stat-cell">
          <p className="up-stat-value">{data.recordSummary.durationMinutes}</p>
          <p className="up-stat-label">总计时(分)</p>
        </div>
        <div className="up-stat-cell">
          <p className="up-stat-value is-positive">+{data.pointDaySummary.earned.toFixed(2)}</p>
          <p className="up-stat-label">获得</p>
        </div>
        <div className="up-stat-cell">
          <p className="up-stat-value is-warning">-{data.pointDaySummary.lost.toFixed(2)}</p>
          <p className="up-stat-label">失去</p>
        </div>
        <div className="up-stat-cell">
          <p className="up-stat-value is-primary">
            {data.pointDaySummary.net >= 0 ? "+" : ""}
            {data.pointDaySummary.net.toFixed(2)}
          </p>
          <p className="up-stat-label">净结余</p>
        </div>
      </div>

      <div className="up-card px-3 py-2 text-sm text-[#637083]">
        当前总余额：<span className="font-semibold up-text-primary">{decimalToNumber(data.pointBalance).toFixed(2)}</span>
      </div>

      <DashboardTimerActions
        activities={data.activities.map((item) => ({
          id: item.id,
          name: item.name,
          icon: item.icon,
        }))}
        runningSession={
          data.runningTimer
            ? {
                id: data.runningTimer.id,
                activityId: data.runningTimer.activityId,
                startedAt: data.runningTimer.startedAt.toISOString(),
                activity: {
                  id: data.runningTimer.activity.id,
                  name: data.runningTimer.activity.name,
                  icon: data.runningTimer.activity.icon,
                },
              }
            : null
        }
        backfillHref={`/records?backfill=1&date=${todayDate}`}
      />

      <SectionCard title="时间轴" description="按时间顺序记录你的一天">
        <div className="space-y-2 text-sm">
          {!timelineItems.length ? (
            <div className="up-empty-state py-14 text-center">
              <IconifyIcon icon="material-symbols:edit-note-rounded" className="size-8" />
              <p className="mt-2">请开始记录您的一天吧</p>
            </div>
          ) : null}
          {timelineItems.map((item) =>
            item.type === "record" ? (
              <div key={item.id} className="up-list-item px-3 py-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-[#3d465a]">
                    {item.record.activity.isEnabled ? item.record.activityNameSnapshot : DELETED_ACTIVITY_NAME}
                  </p>
                  <p
                    className={`font-semibold ${
                      decimalToNumber(item.record.pointDelta) >= 0 ? "text-[#4ab06e]" : "text-[#f39c44]"
                    }`}
                  >
                    {decimalToNumber(item.record.pointDelta) >= 0 ? "+" : ""}
                    {decimalToNumber(item.record.pointDelta).toFixed(2)}
                  </p>
                </div>
                <p className="mt-1 text-xs text-[#9aa5b8]">
                  {item.record.startAt.toLocaleTimeString()} - {item.record.endAt.toLocaleTimeString()} ·{" "}
                  {item.record.durationMinutes} 分钟
                </p>
                {item.record.note ? (
                  <p className="mt-1 text-xs text-[#8795ab]">备注：{item.record.note}</p>
                ) : null}
              </div>
            ) : (
              <div
                key={item.id}
                className="up-empty-state px-3 py-2 text-[#7c93b3]"
              >
                未记录: {item.gap.startAt.toLocaleTimeString()} - {item.gap.endAt.toLocaleTimeString()} (
                {item.gap.durationMinutes} 分钟)
              </div>
            ),
          )}
        </div>
      </SectionCard>

      <Link
        href={`/records?backfill=1&date=${todayDate}`}
        className="up-fab grid place-items-center text-white no-underline"
        aria-label="补录记录"
      >
        +
      </Link>
    </div>
  );
}
