import { createRewardAction } from "@/actions/reward.actions";
import { RewardEditorForm } from "@/components/rewards/reward-editor-form";
import { BackButton } from "@/components/ui/back-button";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { SectionCard } from "@/components/ui/section-card";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NewRewardPage({ searchParams }: PageProps) {
  const query = (await searchParams) ?? {};
  const error = typeof query.error === "string" ? decodeURIComponent(query.error) : undefined;

  return (
    <div className="space-y-3 pb-10">
      <header className="up-card up-page-header">
        <BackButton fallbackHref="/rewards" />
        <h1 className="up-page-title up-header-center-title">新建商品</h1>
      </header>

      <FeedbackBanner error={error} />

      <SectionCard title="商品信息" description="库存留空表示不限兑换次数">
        <RewardEditorForm action={createRewardAction} submitText="创建商品" />
      </SectionCard>
    </div>
  );
}
