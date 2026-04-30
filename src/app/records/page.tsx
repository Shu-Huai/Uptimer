import { addMinutes, set } from "date-fns";

import { RecordsTimelineMobile } from "@/components/records/records-timeline-mobile";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { requireUserId } from "@/lib/auth-guard";
import { DELETED_ACTIVITY_NAME } from "@/lib/constants";
import { formatDateTimeInput, formatDay, parseDayParam } from "@/lib/time";
import { decimalToNumber } from "@/lib/utils";
import { activityService } from "@/modules/activity/activity.service";
import { goalService } from "@/modules/goal/goal.service";
import { recordService } from "@/modules/record/record.service";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

async function loadRecordsData(userId: string, selectedDay: Date) {
  try {
    await goalService.settleOnRecordsVisit(userId).catch(() => undefined);

    const [activities, timeline, summary] = await Promise.all([
      activityService.listEnabled(userId),
      recordService.listByDay(userId, selectedDay),
      recordService.getDaySummary(userId, selectedDay),
    ]);

    return { ok: true as const, activities, timeline, summary };
  } catch {
    return { ok: false as const };
  }
}

export default async function RecordsPage({ searchParams }: PageProps) {
  const userId = await requireUserId();
  const params = (await searchParams) ?? {};
  const error = typeof params.error === "string" ? decodeURIComponent(params.error) : undefined;
  const delta =
    typeof params.delta === "string" && !Number.isNaN(Number(params.delta))
      ? Number(params.delta)
      : undefined;
  const balance =
    typeof params.balance === "string" && !Number.isNaN(Number(params.balance))
      ? Number(params.balance)
      : undefined;
  const success =
    params.success === "record-created"
      ? `记录创建成功并已完成积分结算${
          typeof delta === "number" ? `，本次 ${delta >= 0 ? "+" : ""}${delta.toFixed(2)}` : ""
        }${typeof balance === "number" ? `，余额 ${balance.toFixed(2)}` : ""}。`
      : params.success === "record-updated"
        ? `记录修改成功并已完成积分重算${
            typeof delta === "number" ? `，本次 ${delta >= 0 ? "+" : ""}${delta.toFixed(2)}` : ""
          }${typeof balance === "number" ? `，余额 ${balance.toFixed(2)}` : ""}。`
        : params.success === "record-deleted"
          ? `记录删除成功并已完成积分回滚${
              typeof delta === "number" ? `，本次 ${delta >= 0 ? "+" : ""}${delta.toFixed(2)}` : ""
            }${typeof balance === "number" ? `，余额 ${balance.toFixed(2)}` : ""}。`
      : undefined;
  const backfill = params.backfill === "1";
  const selectedDay = parseDayParam(typeof params.date === "string" ? params.date : undefined);
  const dateValue = formatDay(selectedDay);
  const initialStart = set(selectedDay, { hours: 9, minutes: 0, seconds: 0, milliseconds: 0 });
  const initialEnd = addMinutes(initialStart, 30);
  const data = await loadRecordsData(userId, selectedDay);
  if (!data.ok) {
    return (
      <div className="up-card border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        无法读取记录数据，请先执行 migration 和 seed。
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <FeedbackBanner success={success} error={backfill ? undefined : error} />
      <RecordsTimelineMobile
        dateValue={dateValue}
        activities={data.activities.map((item) => ({
          id: item.id,
          name: item.name,
          icon: item.icon,
          nature: item.nature,
        }))}
        records={data.timeline.records.map((item) => ({
          id: item.id,
          activityId: item.activityId,
          activityNameSnapshot: item.activity.isEnabled ? item.activityNameSnapshot : DELETED_ACTIVITY_NAME,
          activityNatureSnapshot: item.activityNatureSnapshot,
          note: item.note,
          startAt: item.startAt.toISOString(),
          endAt: item.endAt.toISOString(),
          durationMinutes: item.durationMinutes,
          pointDelta: decimalToNumber(item.pointDelta),
        }))}
        gaps={data.timeline.gaps.map((gap) => ({
          id: `${gap.startAt.toISOString()}-${gap.endAt.toISOString()}`,
          startAt: gap.startAt.toISOString(),
          endAt: gap.endAt.toISOString(),
          durationMinutes: gap.durationMinutes,
        }))}
        summary={data.summary}
        defaultStart={formatDateTimeInput(initialStart)}
        defaultEnd={formatDateTimeInput(initialEnd)}
        sheetError={backfill ? error : undefined}
        openDefault={backfill}
      />
    </div>
  );
}
