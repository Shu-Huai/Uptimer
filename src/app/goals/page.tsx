import Link from "next/link";

import { toggleGoalEnabledAction } from "@/actions/goal.actions";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { IconifyIcon } from "@/components/ui/iconify-icon";
import { SectionCard } from "@/components/ui/section-card";
import { requireUserId } from "@/lib/auth-guard";
import { decimalToNumber } from "@/lib/utils";
import { goalService } from "@/modules/goal/goal.service";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function periodLabel(value: "DAILY" | "WEEKLY" | "MONTHLY") {
  if (value === "DAILY") return "每日";
  if (value === "WEEKLY") return "每周";
  return "每月";
}

function formatMinutes(value: number) {
  if (value < 60) return `${value} 分钟`;
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  if (!minutes) return `${hours} 小时`;
  return `${hours} 小时 ${minutes} 分钟`;
}

export default async function GoalsPage({ searchParams }: PageProps) {
  const userId = await requireUserId();
  const params = (await searchParams) ?? {};
  const error = typeof params.error === "string" ? decodeURIComponent(params.error) : undefined;
  const successMap: Record<string, string> = {
    "goal-created": "目标已创建。",
    "goal-updated": "目标已更新。",
    "goal-deleted": "目标已删除。",
  };
  const successBase = successMap[typeof params.success === "string" ? params.success : ""];
  const settleHint = typeof params.settleHint === "string" ? params.settleHint : "";
  const success = successBase
    ? `${successBase}${settleHint === "ready" ? " 当前周期已达成，进入记录页会提前结算积分。" : ""}`
    : undefined;

  const goals = await goalService.getGoalsWithProgress(userId);
  const visibleGoals = goals.filter((goal) => goal.isEnabled);

  return (
    <div className="space-y-3 pb-10">
      <header className="up-card up-page-header">
        <h1 className="up-page-title up-header-center-title">目标</h1>
        <Link href="/goals/new" className="up-secondary-btn absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 text-sm">
          新建
        </Link>
      </header>

      <FeedbackBanner success={success} error={error} />

      <SectionCard title="目标列表" description="启用中目标优先展示">
        <div className="space-y-2">
          {visibleGoals.map((goal) => {
            const progressPercent = Math.round(goal.progress.progressPercent * 100);
            const reward = decimalToNumber(goal.rewardPoints);
            const penalty = decimalToNumber(goal.penaltyPoints);

            return (
              <article key={goal.id} className="up-list-item p-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-[#384862]">
                    <IconifyIcon icon={goal.icon} fallback="material-symbols:target" className="mr-1 inline-block size-4 align-[-2px]" /> {goal.name}
                  </h3>
                </div>

                <p className="mt-1 text-xs text-[#93a0b7]">{periodLabel(goal.periodType)} · 目标 {formatMinutes(goal.targetMinutes)}</p>

                <div className="mt-2">
                  <div className="mb-1 flex items-center justify-between text-xs text-[#7587a2]">
                    <span>
                      {formatMinutes(goal.progress.currentMinutes)} / {formatMinutes(goal.targetMinutes)}
                    </span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="up-progress-track">
                    <div className="up-progress-fill" style={{ width: `${Math.min(100, progressPercent)}%` }} />
                  </div>
                  {goal.progress.currentMinutes > goal.targetMinutes ? <p className="mt-1 text-xs up-text-primary">已超额完成</p> : null}
                </div>

                <p className="mt-2 text-xs text-[#93a0b7]">
                  关联活动 {goal.activityCount} 个 · 完成 +{reward.toFixed(2)} · 失败 -{penalty.toFixed(2)}
                </p>

                <div className="mt-3 flex items-center gap-2 text-sm">
                  <Link href={`/goals/${goal.id}/edit`} className="up-secondary-btn px-3 py-1.5">
                    编辑
                  </Link>
                  <Link href={`/goals/${goal.id}/history`} className="up-inline-chip">
                    结算历史
                  </Link>
                  <form action={toggleGoalEnabledAction}>
                    <input type="hidden" name="id" value={goal.id} />
                    <input type="hidden" name="enabled" value="false" />
                    <input type="hidden" name="returnTo" value="/goals" />
                    <button type="submit" className="up-delete-btn cursor-pointer px-3 py-1.5 text-xs">
                      删除
                    </button>
                  </form>
                </div>
              </article>
            );
          })}
          {!visibleGoals.length ? <p className="up-empty-state py-6 text-center">暂无目标，先创建一个吧。</p> : null}
        </div>
      </SectionCard>
    </div>
  );
}
