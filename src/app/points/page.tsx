import { SectionCard } from "@/components/ui/section-card";
import { BackButton } from "@/components/ui/back-button";
import { requireUserId } from "@/lib/auth-guard";
import { DELETED_ACTIVITY_NAME } from "@/lib/constants";
import { decimalToNumber } from "@/lib/utils";
import { pointsService } from "@/modules/points/points.service";
import { recordRepository } from "@/modules/record/record.repository";

async function loadPointsData(userId: string) {
  try {
    const [balance, transactions] = await Promise.all([
      pointsService.getBalance(userId),
      pointsService.listTransactions(userId),
    ]);
    const recordIds = transactions
      .filter((item) => item.relatedType === "RECORD")
      .map((item) => item.relatedId);
    const relatedRecords = await recordRepository.listByUserAndIds(userId, recordIds);
    const relatedRecordMap = new Map(relatedRecords.map((item) => [item.id, item]));

    return { ok: true as const, balance, transactions, relatedRecordMap };
  } catch {
    return { ok: false as const };
  }
}

export default async function PointsPage() {
  const userId = await requireUserId();
  const data = await loadPointsData(userId);

  if (!data.ok) {
    return (
      <div className="up-card border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        无法读取积分数据，请先执行 migration 和 seed。
      </div>
    );
  }

  const transactions = data.transactions;
  const relatedRecordMap = data.relatedRecordMap;

  function displayTransactionTitle(item: (typeof transactions)[number]) {
    const base = item.note ?? item.type;
    if (item.relatedType !== "RECORD") return base;

    const record = relatedRecordMap.get(item.relatedId);
    if (!record || record.activity.isEnabled) return base;

    if (record.activityNameSnapshot && base.includes(record.activityNameSnapshot)) {
      return base.split(record.activityNameSnapshot).join(DELETED_ACTIVITY_NAME);
    }
    return `记录积分变动：${DELETED_ACTIVITY_NAME}`;
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <header className="up-card up-page-header">
        <BackButton fallbackHref="/activities" />
        <h1 className="up-page-title">积分流水</h1>
        <span className="up-page-meta">⋯</span>
      </header>

      <SectionCard title="当前积分">
        <p className="text-3xl font-semibold up-text-primary">{decimalToNumber(data.balance).toFixed(2)}</p>
        <div className="up-segmented mt-3 grid-cols-2 text-sm">
          <button type="button" className="up-segmented-btn is-active py-2">
            活动相关
          </button>
          <button type="button" className="up-segmented-btn py-2">
            其他积分
          </button>
        </div>
      </SectionCard>

      <section className="up-card flex min-h-0 flex-1 flex-col p-4">
        <div className="mb-4 border-b border-[#e7eef9] pb-3">
          <h2 className="text-base font-semibold tracking-[0.01em] text-[#2f3f57]">最近 100 条流水</h2>
        </div>
        <div className="up-scrollbar flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
          {transactions.map((item) => (
            <article
              key={item.id}
              className="up-list-item flex items-center justify-between px-3 py-3"
            >
              <div>
                <p className="font-semibold text-[#3f4b63]">{displayTransactionTitle(item)}</p>
                <p className="mt-0.5 text-xs text-[#98a1b3]">{item.happenedAt.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p
                  className={`text-lg font-semibold ${decimalToNumber(item.amount) >= 0 ? "up-text-positive" : "up-text-warning"}`}
                >
                  {decimalToNumber(item.amount) >= 0 ? "+" : ""}
                  {decimalToNumber(item.amount).toFixed(2)}
                </p>
                <p className="text-xs text-[#a0aabd]">余额 {decimalToNumber(item.balanceAfter).toFixed(2)}</p>
              </div>
            </article>
          ))}
          {!data.transactions.length ? <p className="up-empty-state flex min-h-full items-center justify-center px-2 py-4 text-center">暂无流水</p> : null}
        </div>
      </section>
    </div>
  );
}
