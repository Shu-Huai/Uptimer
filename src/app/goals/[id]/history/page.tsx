import { notFound } from "next/navigation";

import { BackButton } from "@/components/ui/back-button";
import { SettlementRollbackButton } from "@/components/goals/settlement-rollback-button";
import { SectionCard } from "@/components/ui/section-card";
import { requireUserId } from "@/lib/auth-guard";
import { decimalToNumber } from "@/lib/utils";
import { goalService } from "@/modules/goal/goal.service";

type GoalHistoryPageProps = {
  params: Promise<{ id: string }>;
};

function formatRange(start: Date, end: Date) {
  return `${start.toLocaleDateString()} - ${new Date(end.getTime() - 1).toLocaleDateString()}`;
}

export default async function GoalHistoryPage({ params }: GoalHistoryPageProps) {
  const userId = await requireUserId();
  const { id } = await params;

  let goal: Awaited<ReturnType<typeof goalService.getById>>;
  try {
    goal = await goalService.getById(userId, id);
  } catch {
    notFound();
  }

  const history = await goalService.getGoalSettlementHistory(userId, id);
  const progressPercent = Math.round(goal.progress.progressPercent * 100);

  return (
    <div className="space-y-3 pb-10">
      <header className="up-card up-page-header">
        <BackButton fallbackHref="/goals" />
        <h1 className="up-page-title">目标历史</h1>
        <span className="up-page-meta">{goal.name}</span>
      </header>

      <SectionCard title="当前周期进度">
        <p className="text-sm up-text-weak">
          {goal.progress.currentMinutes}/{goal.targetMinutes} 分钟（{progressPercent}%）
        </p>
        <div className="up-progress-track mt-2">
          <div className="up-progress-fill" style={{ width: `${Math.min(100, progressPercent)}%` }} />
        </div>
      </SectionCard>

      <SectionCard title="结算历史" description="最近 100 条">
        <div className="space-y-2">
          {history.map((item) => (
            <article key={item.id} className="up-list-item px-3 py-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-[#40516d]">{formatRange(item.periodStart, item.periodEnd)}</p>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      item.isCompleted ? "bg-[#e9f7ef] text-[#3e9f5c]" : "bg-[#fff2e8] text-[#d87f2d]"
                    }`}
                  >
                    {item.isCompleted ? "已完成" : "未完成"}
                  </span>
                  <SettlementRollbackButton goalId={id} settlementId={item.id} />
                </div>
              </div>
              <p className="mt-1 text-xs text-[#8fa0bb]">
                {item.totalMinutes}/{item.targetMinutesSnapshot} 分钟
              </p>
              <p className="mt-1 text-sm text-[#61738f]">
                奖惩 {decimalToNumber(item.pointDelta) >= 0 ? "+" : ""}
                {decimalToNumber(item.pointDelta).toFixed(2)}
              </p>
              <p className="mt-1 text-xs text-[#a0adbf]">结算于 {item.settledAt.toLocaleString()}</p>
            </article>
          ))}
          {!history.length ? <p className="up-empty-state py-6 text-center">暂无结算记录</p> : null}
        </div>
      </SectionCard>
    </div>
  );
}
