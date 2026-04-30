import { notFound } from "next/navigation";

import { updateGoalAction } from "@/actions/goal.actions";
import { GoalEditorForm } from "@/components/goals/goal-editor-form";
import { BackButton } from "@/components/ui/back-button";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { SectionCard } from "@/components/ui/section-card";
import { requireUserId } from "@/lib/auth-guard";
import { decimalToNumber } from "@/lib/utils";
import { activityService } from "@/modules/activity/activity.service";
import { goalService } from "@/modules/goal/goal.service";

type EditGoalPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditGoalPage({ params, searchParams }: EditGoalPageProps) {
  const userId = await requireUserId();
  const { id } = await params;
  const query = (await searchParams) ?? {};
  const error = typeof query.error === "string" ? decodeURIComponent(query.error) : undefined;
  const activities = await activityService.list(userId);
  let goal: Awaited<ReturnType<typeof goalService.getById>>;

  try {
    goal = await goalService.getById(userId, id);
  } catch {
    notFound();
  }

  const selectedActivityIds = new Set(goal.activityIds);
  const editableActivities = activities.filter((activity) => activity.isEnabled || selectedActivityIds.has(activity.id));

  return (
    <div className="space-y-3 pb-10">
      <header className="up-card up-page-header">
        <BackButton fallbackHref="/goals" />
        <h1 className="up-page-title">编辑目标</h1>
        <span className="up-page-meta">ID</span>
      </header>

      <FeedbackBanner error={error} />

      <SectionCard title="修改目标" description="修改仅影响后续未结算周期，历史结算不回溯">
        <GoalEditorForm
          action={updateGoalAction}
          submitText="保存目标"
          activities={editableActivities.map((activity) => ({
            id: activity.id,
            name: activity.name,
            icon: activity.icon,
            nature: activity.nature,
            isEnabled: activity.isEnabled,
            isDeleted: !activity.isEnabled,
          }))}
          goal={{
            id: goal.id,
            name: goal.name,
            note: goal.note,
            icon: goal.icon,
            periodType: goal.periodType,
            targetMinutes: goal.targetMinutes,
            rewardPoints: decimalToNumber(goal.rewardPoints),
            penaltyPoints: decimalToNumber(goal.penaltyPoints),
            isEnabled: goal.isEnabled,
            activityIds: goal.activityIds,
          }}
        />
      </SectionCard>
    </div>
  );
}
