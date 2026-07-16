import Link from "next/link";

import { ActivityCreateForm } from "@/components/activities/activity-create-form";
import { ActivityListManager } from "@/components/activities/activity-list-manager";
import { BackButton } from "@/components/ui/back-button";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { SectionCard } from "@/components/ui/section-card";
import { requireUserId } from "@/lib/auth-guard";
import { decimalToNumber } from "@/lib/utils";
import { activityService } from "@/modules/activity/activity.service";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

async function loadActivitiesData(userId: string) {
  try {
    const activities = await activityService.list(userId);

    return { ok: true as const, activities };
  } catch {
    return { ok: false as const };
  }
}

export default async function ActivitiesPage({ searchParams }: PageProps) {
  const userId = await requireUserId();
  const params = (await searchParams) ?? {};
  const error = typeof params.error === "string" ? decodeURIComponent(params.error) : undefined;
  const successMap: Record<string, string> = {
    "activity-created": "活动创建成功，已可用于补录与计时。",
    "activity-updated": "活动已更新。",
    "activity-enabled": "活动已启用，可用于计时与补录。",
    "activity-disabled": "活动已停用，不会出现在计时与补录选项中。",
    "activity-deleted": "活动已删除。",
  };
  const successKey = typeof params.success === "string" ? params.success : "";
  const success = successMap[successKey];
  const data = await loadActivitiesData(userId);

  if (!data.ok) {
    return (
      <div className="up-card border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        无法读取活动数据，请先执行 migration 和 seed。
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-10">
      <header className="up-card up-page-header">
        <BackButton fallbackHref="/dashboard" />
        <h1 className="up-page-title">活动管理</h1>
        <Link href="/points" className="up-secondary-btn px-3 py-1.5 text-sm">
          流水
        </Link>
      </header>
      <FeedbackBanner success={success} error={error} />

      <SectionCard title="新增活动" description="按活动性质设置回报率，后续用于自动结算积分">
        <ActivityCreateForm />
      </SectionCard>

      <SectionCard title="活动列表">
        <ActivityListManager
          activities={data.activities
            .filter((activity) => activity.isEnabled)
            .map((activity) => ({
            id: activity.id,
            name: activity.name,
            note: activity.note,
            icon: activity.icon,
            nature: activity.nature,
            rewardRatePerHour: decimalToNumber(activity.rewardRatePerHour),
            isEnabled: activity.isEnabled,
            }))}
        />
      </SectionCard>
    </div>
  );
}
