import { notFound } from "next/navigation";

import { ActivityEditForm } from "@/components/activities/activity-edit-form";
import { BackButton } from "@/components/ui/back-button";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { SectionCard } from "@/components/ui/section-card";
import { requireUserId } from "@/lib/auth-guard";
import { activityService } from "@/modules/activity/activity.service";

type EditActivityPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditActivityPage({ params, searchParams }: EditActivityPageProps) {
  const userId = await requireUserId();
  const { id } = await params;
  const query = (await searchParams) ?? {};
  const error = typeof query.error === "string" ? decodeURIComponent(query.error) : undefined;
  let activity: Awaited<ReturnType<typeof activityService.getById>>;

  try {
    activity = await activityService.getById(userId, id);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-3 pb-10">
      <header className="up-card up-page-header">
        <BackButton fallbackHref="/activities" />
        <h1 className="up-page-title up-header-center-title">编辑活动</h1>
      </header>

      <FeedbackBanner error={error} />

      <SectionCard title="修改活动" description="修改后只影响新记录，不会回溯历史结算结果">
        <ActivityEditForm activity={activity} />
      </SectionCard>
    </div>
  );
}
