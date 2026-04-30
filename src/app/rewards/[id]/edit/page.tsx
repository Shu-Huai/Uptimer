import { notFound } from "next/navigation";

import { updateRewardAction } from "@/actions/reward.actions";
import { RewardEditorForm } from "@/components/rewards/reward-editor-form";
import { BackButton } from "@/components/ui/back-button";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { SectionCard } from "@/components/ui/section-card";
import { requireUserId } from "@/lib/auth-guard";
import { decimalToNumber } from "@/lib/utils";
import { rewardService } from "@/modules/reward/reward.service";

type EditRewardPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditRewardPage({ params, searchParams }: EditRewardPageProps) {
  const userId = await requireUserId();
  const { id } = await params;
  const query = (await searchParams) ?? {};
  const error = typeof query.error === "string" ? decodeURIComponent(query.error) : undefined;
  let reward: Awaited<ReturnType<typeof rewardService.getById>>;

  try {
    reward = await rewardService.getById(userId, id);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-3 pb-10">
      <header className="up-card up-page-header">
        <BackButton fallbackHref="/rewards" />
        <h1 className="up-page-title">编辑商品</h1>
        <span className="up-page-meta">ID</span>
      </header>

      <FeedbackBanner error={error} />

      <SectionCard title="修改商品" description="修改价格和库存只影响后续兑换，不会回溯历史记录">
        <RewardEditorForm
          action={updateRewardAction}
          submitText="保存商品"
          reward={{
            id: reward.id,
            name: reward.name,
            note: reward.note,
            icon: reward.icon,
            pricePoints: decimalToNumber(reward.pricePoints),
            stock: reward.stockMode === "UNLIMITED" ? null : reward.stock,
          }}
        />
      </SectionCard>
    </div>
  );
}
