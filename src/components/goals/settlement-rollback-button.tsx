"use client";

import { rollbackGoalSettlementAction } from "@/actions/goal.actions";

type SettlementRollbackButtonProps = {
  goalId: string;
  settlementId: string;
};

export function SettlementRollbackButton({ goalId, settlementId }: SettlementRollbackButtonProps) {
  return (
    <form
      action={rollbackGoalSettlementAction}
      onSubmit={(event) => {
        if (!window.confirm("撤回这条结算记录？对应积分会恢复，之后可以再次结算。")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="goalId" value={goalId} />
      <input type="hidden" name="settlementId" value={settlementId} />
      <input type="hidden" name="returnTo" value={`/goals/${goalId}/history`} />
      <button type="submit" className="up-delete-btn px-3 py-1.5 text-xs">
        撤回
      </button>
    </form>
  );
}
