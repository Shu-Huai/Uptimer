import Link from "next/link";

import { deleteRewardAction, redeemRewardAction } from "@/actions/reward.actions";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { IconifyIcon } from "@/components/ui/iconify-icon";
import { SectionCard } from "@/components/ui/section-card";
import { requireUserId } from "@/lib/auth-guard";
import { decimalToNumber } from "@/lib/utils";
import { rewardService } from "@/modules/reward/reward.service";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function formatTimeValue(value: number | null) {
  if (value === null) return "--";
  return `${value.toFixed(2)}/h`;
}

export default async function RewardsPage({ searchParams }: PageProps) {
  const userId = await requireUserId();
  const params = (await searchParams) ?? {};
  const error = typeof params.error === "string" ? decodeURIComponent(params.error) : undefined;
  const successMap: Record<string, string> = {
    "reward-created": "商品已创建。",
    "reward-updated": "商品已更新。",
    "reward-redeemed": "兑换成功。",
    "reward-deleted": "商品已删除。",
  };
  const success = successMap[typeof params.success === "string" ? params.success : ""];

  const { items, stats } = await rewardService.getRewardsPageData(userId);
  const pointBalance = decimalToNumber(stats.pointBalance);
  const rewardItems = items;

  return (
    <div className="space-y-3 pb-10">
      <header className="overflow-hidden rounded-3xl border border-[#d8e9df] bg-[linear-gradient(165deg,#8fd7c1_0%,#2b8b70_68%,#1f6f58_100%)] px-4 py-5 text-white shadow-[0_20px_40px_rgba(30,98,79,0.28)]">
        <div className="flex items-center justify-between text-sm">
          <span className="w-4" aria-hidden />
        </div>
        <p className="mt-4 text-center text-2xl font-semibold">动力商店</p>
        <p className="mt-1 text-center text-sm text-white/80">用努力后的成果喂养一个自律的自己</p>
      </header>

      <FeedbackBanner success={success} error={error} />

      <div className="up-card up-stat-grid !grid-cols-3">
        <div className="up-stat-cell">
          <p className="up-stat-value">{stats.itemCount}</p>
          <p className="up-stat-label">商品数量</p>
        </div>
        <div className="up-stat-cell">
          <p className="up-stat-value is-primary">{pointBalance.toFixed(2)}</p>
          <p className="up-stat-label">当前积分</p>
        </div>
        <div className="up-stat-cell">
          <p className="up-stat-value is-warning">{formatTimeValue(stats.timeValuePerHour)}</p>
          <p className="up-stat-label">时间价值</p>
        </div>
      </div>

      <p className="px-1 text-sm up-text-weak">累计兑换 {stats.redemptionCount} 次</p>

      <SectionCard title="可兑换商品">
        <div className="space-y-2">
          {rewardItems.map((item) => {
            const price = decimalToNumber(item.pricePoints);
            const soldOut = item.stockMode === "LIMITED" && (item.stock ?? 0) <= 0;
            const canRedeem = !soldOut && pointBalance >= price;
            const stockText = item.stockMode === "UNLIMITED" ? "不限库存" : `库存 ${(item.stock ?? 0).toString()}`;

            return (
            <article
              key={item.id}
              className="up-list-item flex items-center justify-between border-[#d9e9e2] bg-[#f7fffb] px-3 py-3"
            >
              <div className="min-w-0">
                <p className="font-semibold text-[#3f4c63]">
                  <IconifyIcon icon={item.icon} fallback="🎁" className="mr-1 inline-block size-4 align-[-2px]" /> {item.name}
                </p>
                <p className="text-xs text-[#90a0b7]">🪙 {price.toFixed(2)} · {stockText}</p>
                {item.note ? <p className="mt-1 truncate text-xs text-[#a2aec0]">{item.note}</p> : null}
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/rewards/${item.id}/edit`} className="up-inline-chip px-3 py-1.5 text-sm">
                    <IconifyIcon icon="material-symbols:edit-rounded"/>
                </Link>
                <form action={deleteRewardAction}>
                  <input type="hidden" name="id" value={item.id} />
                  <button type="submit" className="up-inline-chip cursor-pointer px-3 py-1.5 text-sm">
                    <IconifyIcon icon="material-symbols:delete"/>
                  </button>
                </form>
                <form action={redeemRewardAction}>
                  <input type="hidden" name="rewardItemId" value={item.id} />
                  <button type="submit" className="up-secondary-btn px-2 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60" disabled={!canRedeem}>
                    {soldOut ? "售罄" : pointBalance < price ? "不足" : "兑换"}
                  </button>
                </form>
              </div>
            </article>
            );
          })}
          {!rewardItems.length ? <p className="up-empty-state py-6 text-center">暂无可兑换商品，先创建一个吧。</p> : null}
        </div>
      </SectionCard>

      <Link href="/rewards/new" className="up-fab grid place-items-center text-white no-underline" aria-label="添加商品">
                <IconifyIcon icon="material-symbols:add" className="up-icon up-icon-xl" />
      </Link>
    </div>
  );
}
