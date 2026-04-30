import { createGoalAction } from "@/actions/goal.actions";
import { GoalEditorForm } from "@/components/goals/goal-editor-form";
import { BackButton } from "@/components/ui/back-button";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { SectionCard } from "@/components/ui/section-card";
import { requireUserId } from "@/lib/auth-guard";
import { activityService } from "@/modules/activity/activity.service";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NewGoalPage({ searchParams }: PageProps) {
  const userId = await requireUserId();
  const query = (await searchParams) ?? {};
  const error = typeof query.error === "string" ? decodeURIComponent(query.error) : undefined;
  const activities = await activityService.listEnabled(userId);

  return (
    <div className="space-y-3 pb-10">
      <header className="up-card up-page-header">
        <BackButton fallbackHref="/goals" />
        <h1 className="up-page-title">新建目标</h1>
        <span className="up-page-meta">V1</span>
      </header>

      <FeedbackBanner error={error} />

      <SectionCard title="目标设置" description="按周期统计关联活动总时长并结算奖惩积分">
        <GoalEditorForm
          action={createGoalAction}
          submitText="创建目标"
          activities={activities.map((activity) => ({
            id: activity.id,
            name: activity.name,
            icon: activity.icon,
            nature: activity.nature,
            isEnabled: activity.isEnabled,
            isDeleted: false,
          }))}
        />
      </SectionCard>
    </div>
  );
}
