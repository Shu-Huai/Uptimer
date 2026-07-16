import { GoalPeriodType, PointRelatedType, PointTransactionType, Prisma } from "@prisma/client";
import { addDays, addMonths, startOfDay, startOfMonth, startOfWeek, subDays, subMonths, subWeeks } from "date-fns";

import { db } from "@/lib/db";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { decimalToNumber, toDecimal } from "@/lib/utils";
import { activityRepository } from "@/modules/activity/activity.repository";
import { pointsService } from "@/modules/points/points.service";

import { createGoalSchema, toggleGoalEnabledSchema, updateGoalSchema } from "./goal.schemas";
import { goalRepository } from "./goal.repository";
import type {
  CreateGoalInput,
  GoalProgressView,
  ReconcileGoalSettlementsByRecordMutationInput,
  RollbackGoalSettlementByRecordDeleteInput,
  RollbackGoalSettlementInput,
  ToggleGoalEnabledInput,
  UpdateGoalInput,
} from "./goal.types";

function normalizeIds(ids: string[]) {
  return [...new Set(ids)];
}

function getCurrentPeriodRange(periodType: GoalPeriodType, now: Date) {
  if (periodType === GoalPeriodType.DAILY) {
    const periodStart = startOfDay(now);
    return { periodStart, periodEnd: addDays(periodStart, 1) };
  }

  if (periodType === GoalPeriodType.WEEKLY) {
    const periodStart = startOfWeek(now, { weekStartsOn: 1 });
    return { periodStart, periodEnd: addDays(periodStart, 7) };
  }

  const periodStart = startOfMonth(now);
  return { periodStart, periodEnd: addMonths(periodStart, 1) };
}

function getLastFinishedPeriodRange(periodType: GoalPeriodType, now: Date) {
  if (periodType === GoalPeriodType.DAILY) {
    const periodEnd = startOfDay(now);
    return { periodStart: subDays(periodEnd, 1), periodEnd };
  }

  if (periodType === GoalPeriodType.WEEKLY) {
    const periodEnd = startOfWeek(now, { weekStartsOn: 1 });
    return { periodStart: subWeeks(periodEnd, 1), periodEnd };
  }

  const periodEnd = startOfMonth(now);
  return { periodStart: subMonths(periodEnd, 1), periodEnd };
}

async function ensureActivitiesOwned(
  userId: string,
  activityIds: string[],
  options?: { requireEnabled?: boolean },
  tx?: Prisma.TransactionClient,
) {
  const normalized = normalizeIds(activityIds);
  const activities = await activityRepository.listByUserAndIds(userId, normalized, tx);
  if (activities.length !== normalized.length) {
    throw new ValidationError("存在无效的活动关联");
  }
  if (options?.requireEnabled && activities.some((item) => !item.isEnabled)) {
    throw new ValidationError("不能关联已删除的活动");
  }
  return activities;
}

async function createOrReplaceGoalActivities(goalId: string, activityIds: string[], tx: Prisma.TransactionClient) {
  const normalized = normalizeIds(activityIds);
  await goalRepository.deleteGoalActivities(goalId, tx);
  await goalRepository.createGoalActivities(goalId, normalized, tx);
}

async function computeGoalProgress(
  userId: string,
  goal: {
    id: string;
    periodType: GoalPeriodType;
    targetMinutes: number;
    isEnabled: boolean;
    activities: Array<{ activityId: string }>;
  },
  now: Date,
): Promise<GoalProgressView> {
  const { periodStart, periodEnd } = getCurrentPeriodRange(goal.periodType, now);
  const activityIds = goal.activities.map((item) => item.activityId);
  const currentMinutes =
    goal.isEnabled && activityIds.length > 0
      ? await goalRepository.sumGoalMinutesInRange(userId, activityIds, periodStart, periodEnd)
      : 0;

  const progressPercent = goal.targetMinutes > 0 ? Math.min(currentMinutes / goal.targetMinutes, 1) : 0;
  return {
    goalId: goal.id,
    currentMinutes,
    targetMinutes: goal.targetMinutes,
    progressPercent,
    isCompletedPreview: currentMinutes >= goal.targetMinutes,
    periodStart,
    periodEnd,
  };
}

function areAllGoalActivitiesDeleted(goalActivities: Array<{ activity: { isEnabled: boolean } }>) {
  return goalActivities.length > 0 && goalActivities.every((item) => !item.activity.isEnabled);
}

function computeSettlementPointDelta(params: {
  isCompleted: boolean;
  rewardPointsSnapshot: number;
  penaltyPointsSnapshot: number;
  allActivitiesDeleted: boolean;
}) {
  const { isCompleted, rewardPointsSnapshot, penaltyPointsSnapshot, allActivitiesDeleted } = params;
  if (isCompleted) return rewardPointsSnapshot;
  if (allActivitiesDeleted) return 0;
  return -penaltyPointsSnapshot;
}

async function lockGoalSettlementPeriod(
  tx: Prisma.TransactionClient,
  goalId: string,
  periodStart: Date,
  periodEnd: Date,
) {
  const key = `${goalId}:${periodStart.toISOString()}:${periodEnd.toISOString()}`;
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key})::bigint)`;
}

async function settleGoalForPeriod(params: {
  goal: Awaited<ReturnType<typeof goalRepository.listEnabledGoalsForSettlement>>[number];
  periodStart: Date;
  periodEnd: Date;
  now: Date;
  allowIncomplete: boolean;
}) {
  const { goal, periodStart, periodEnd, now, allowIncomplete } = params;

  try {
    return await db.$transaction(async (tx) => {
      await lockGoalSettlementPeriod(tx, goal.id, periodStart, periodEnd);

      const existed = await goalRepository.findSettlementByUnique(goal.id, periodStart, periodEnd, tx);
      if (existed) {
        return {
          goalId: goal.id,
          goalName: goal.name,
          periodStart,
          periodEnd,
          totalMinutes: 0,
          targetMinutes: goal.targetMinutes,
          isCompleted: false,
          pointDelta: 0,
          skipped: true as const,
          reason: "already-settled",
        };
      }

      const activityIds = goal.activities.map((item) => item.activityId);
      const totalMinutes = await goalRepository.sumGoalMinutesInRange(
        goal.userId,
        activityIds,
        periodStart,
        periodEnd,
        tx,
      );
      const targetMinutesSnapshot = goal.targetMinutes;
      const rewardPointsSnapshot = decimalToNumber(goal.rewardPoints);
      const penaltyPointsSnapshot = decimalToNumber(goal.penaltyPoints);
      const isCompleted = totalMinutes >= targetMinutesSnapshot;

      if (!isCompleted && !allowIncomplete) {
        return {
          goalId: goal.id,
          goalName: goal.name,
          periodStart,
          periodEnd,
          totalMinutes,
          targetMinutes: goal.targetMinutes,
          isCompleted: false,
          pointDelta: 0,
          skipped: true as const,
          reason: "not-completed",
        };
      }

      const pointDelta = computeSettlementPointDelta({
        isCompleted,
        rewardPointsSnapshot,
        penaltyPointsSnapshot,
        allActivitiesDeleted: areAllGoalActivitiesDeleted(goal.activities),
      });

      const createdSettlement = await goalRepository.createSettlement(
        {
          data: {
            userId: goal.userId,
            goalId: goal.id,
            periodStart,
            periodEnd,
            totalMinutes,
            targetMinutesSnapshot,
            rewardPointsSnapshot: toDecimal(rewardPointsSnapshot),
            penaltyPointsSnapshot: toDecimal(penaltyPointsSnapshot),
            isCompleted,
            pointDelta: toDecimal(pointDelta),
            settledAt: now,
          },
        },
        tx,
      );

      if (Math.abs(pointDelta) >= 0.005) {
        await pointsService.appendTransaction(
          {
            userId: goal.userId,
            type: pointDelta >= 0 ? PointTransactionType.GOAL_REWARD : PointTransactionType.GOAL_PENALTY,
            amount: pointDelta,
            relatedType: PointRelatedType.GOAL_SETTLEMENT,
            relatedId: createdSettlement.id,
            note: `目标结算：${goal.name} (${totalMinutes}/${targetMinutesSnapshot} 分钟)`,
            happenedAt: now,
          },
          tx,
        );
      }

      return {
        goalId: goal.id,
        goalName: goal.name,
        periodStart,
        periodEnd,
        totalMinutes,
        targetMinutes: goal.targetMinutes,
        isCompleted,
        pointDelta,
        skipped: false as const,
      };
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        goalId: goal.id,
        goalName: goal.name,
        periodStart,
        periodEnd,
        totalMinutes: 0,
        targetMinutes: goal.targetMinutes,
        isCompleted: false,
        pointDelta: 0,
        skipped: true as const,
        reason: "already-settled",
      };
    }
    throw error;
  }
}

async function settleGoalsByVisit(
  goals: Awaited<ReturnType<typeof goalRepository.listEnabledGoalsForSettlement>>,
  now = new Date(),
) {
  const settled: Array<{
    goalId: string;
    goalName: string;
    periodStart: Date;
    periodEnd: Date;
    totalMinutes: number;
    targetMinutes: number;
    isCompleted: boolean;
    pointDelta: number;
    skipped: boolean;
    reason?: string;
  }> = [];

  for (const goal of goals) {
    const lastPeriod = getLastFinishedPeriodRange(goal.periodType, now);
    const currentPeriod = getCurrentPeriodRange(goal.periodType, now);

    const [lastResult, currentEarlyResult] = await Promise.all([
      settleGoalForPeriod({
        goal,
        periodStart: lastPeriod.periodStart,
        periodEnd: lastPeriod.periodEnd,
        now,
        allowIncomplete: true,
      }),
      settleGoalForPeriod({
        goal,
        periodStart: currentPeriod.periodStart,
        periodEnd: currentPeriod.periodEnd,
        now,
        allowIncomplete: false,
      }),
    ]);

    settled.push(lastResult);
    settled.push(currentEarlyResult);
  }

  return {
    settledCount: settled.filter((item) => !item.skipped).length,
    scannedCount: goals.length,
    settlements: settled,
  };
}

export const goalService = {
  async create(input: CreateGoalInput) {
    const parsed = createGoalSchema.parse(input);

    return db.$transaction(async (tx) => {
      await ensureActivitiesOwned(parsed.userId, parsed.activityIds, { requireEnabled: true }, tx);

      const goal = await goalRepository.createGoal(
        {
          data: {
            userId: parsed.userId,
            name: parsed.name,
            note: parsed.note,
            icon: parsed.icon,
            color: "#2a9df4",
            periodType: parsed.periodType,
            targetMinutes: parsed.targetMinutes,
            rewardPoints: toDecimal(parsed.rewardPoints),
            penaltyPoints: toDecimal(parsed.penaltyPoints),
            isEnabled: parsed.isEnabled,
          },
        },
        tx,
      );

      await goalRepository.createGoalActivities(goal.id, normalizeIds(parsed.activityIds), tx);
      return goal;
    });
  },

  async update(input: UpdateGoalInput) {
    const parsed = updateGoalSchema.parse(input);

    return db.$transaction(async (tx) => {
      const existing = await goalRepository.findGoalByUserAndId(parsed.userId, parsed.id, tx);
      if (!existing) {
        throw new NotFoundError("目标不存在");
      }
      await ensureActivitiesOwned(parsed.userId, parsed.activityIds, { requireEnabled: false }, tx);

      const updated = await goalRepository.updateGoal(
        {
          where: { id: parsed.id },
          data: {
            name: parsed.name,
            note: parsed.note,
            icon: parsed.icon,
            color: "#2a9df4",
            periodType: parsed.periodType,
            targetMinutes: parsed.targetMinutes,
            rewardPoints: toDecimal(parsed.rewardPoints),
            penaltyPoints: toDecimal(parsed.penaltyPoints),
            isEnabled: parsed.isEnabled,
          },
        },
        tx,
      );

      await createOrReplaceGoalActivities(parsed.id, parsed.activityIds, tx);
      return updated;
    });
  },

  async toggleEnabled(input: ToggleGoalEnabledInput) {
    const parsed = toggleGoalEnabledSchema.parse(input);
    const existing = await goalRepository.findGoalByUserAndId(parsed.userId, parsed.id);
    if (!existing) {
      throw new NotFoundError("目标不存在");
    }

    return goalRepository.updateGoal({
      where: { id: parsed.id },
      data: { isEnabled: parsed.enabled },
    });
  },

  async getById(userId: string, goalId: string) {
    const goal = await goalRepository.findGoalByUserAndId(userId, goalId);
    if (!goal) {
      throw new NotFoundError("目标不存在");
    }

    const progress = await computeGoalProgress(
      userId,
      {
        id: goal.id,
        periodType: goal.periodType,
        targetMinutes: goal.targetMinutes,
        isEnabled: goal.isEnabled,
        activities: goal.activities.map((item) => ({ activityId: item.activityId })),
      },
      new Date(),
    );

    return {
      ...goal,
      progress,
      activityIds: goal.activities.map((item) => item.activityId),
    };
  },

  async getGoalsWithProgress(userId: string) {
    const goals = await goalRepository.listGoalsByUser(userId);
    const now = new Date();
    const progressList = await Promise.all(
      goals.map((goal) =>
        computeGoalProgress(
          userId,
          {
            id: goal.id,
            periodType: goal.periodType,
            targetMinutes: goal.targetMinutes,
            isEnabled: goal.isEnabled,
            activities: goal.activities.map((item) => ({ activityId: item.activityId })),
          },
          now,
        ),
      ),
    );
    const progressMap = new Map(progressList.map((item) => [item.goalId, item]));

    return goals
      .map((goal) => ({
        ...goal,
        progress: progressMap.get(goal.id)!,
        activityCount: goal.activities.length,
      }))
      .sort((a, b) => {
        if (a.isEnabled !== b.isEnabled) return a.isEnabled ? -1 : 1;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
  },

  async getGoalProgress(userId: string, goalId: string) {
    const goal = await goalRepository.findGoalByUserAndId(userId, goalId);
    if (!goal) {
      throw new NotFoundError("目标不存在");
    }

    return computeGoalProgress(
      userId,
      {
        id: goal.id,
        periodType: goal.periodType,
        targetMinutes: goal.targetMinutes,
        isEnabled: goal.isEnabled,
        activities: goal.activities.map((item) => ({ activityId: item.activityId })),
      },
      new Date(),
    );
  },

  async getGoalSettlementHistory(userId: string, goalId: string) {
    const goal = await goalRepository.findGoalByUserAndId(userId, goalId);
    if (!goal) {
      throw new NotFoundError("目标不存在");
    }

    return goalRepository.listGoalSettlementHistory(userId, goalId);
  },

  async rollbackSettlement(input: RollbackGoalSettlementInput) {
    return db.$transaction(async (tx) => {
      const settlement = await goalRepository.findSettlementByUserAndId(
        input.userId,
        input.goalId,
        input.settlementId,
        tx,
      );
      if (!settlement) {
        throw new NotFoundError("结算记录不存在或已撤回");
      }

      const pointDelta = decimalToNumber(settlement.pointDelta);
      if (Math.abs(pointDelta) >= 0.005) {
        const restoreAmount = Number((-pointDelta).toFixed(2));
        await pointsService.appendTransaction(
          {
            userId: input.userId,
            type: restoreAmount >= 0 ? PointTransactionType.GOAL_REWARD : PointTransactionType.GOAL_PENALTY,
            amount: restoreAmount,
            relatedType: PointRelatedType.GOAL_SETTLEMENT,
            relatedId: settlement.id,
            note: `撤回目标结算：${settlement.goal.name}`,
            happenedAt: new Date(),
          },
          tx,
        );
      }

      await goalRepository.deleteSettlement(settlement.id, tx);
      return { settlementId: settlement.id, restoredPoints: Number((-pointDelta).toFixed(2)) };
    });
  },

  async settleOnRecordsVisit(userId: string, now = new Date()) {
    const goals = await goalRepository.listEnabledGoalsForSettlement(userId);
    return settleGoalsByVisit(goals, now);
  },

  async settleExpiredGoals(now = new Date()) {
    const goals = await goalRepository.listEnabledGoalsForSettlement();
    return settleGoalsByVisit(goals, now);
  },

  async rollbackSettlementRewardsAfterRecordDeletion(
    input: RollbackGoalSettlementByRecordDeleteInput,
    tx?: Prisma.TransactionClient,
  ) {
    return goalService.reconcileSettlementsByRecordMutation(
      {
        userId: input.userId,
        activityIds: [input.activityId],
        startAt: input.startAt,
        endAt: input.endAt,
      },
      tx,
    );
  },

  async reconcileSettlementsByRecordMutation(
    input: ReconcileGoalSettlementsByRecordMutationInput,
    tx?: Prisma.TransactionClient,
  ) {
    const normalizedActivityIds = [...new Set(input.activityIds)].filter(Boolean);

    const applyReconcile = async (trx: Prisma.TransactionClient) => {
      const settlements = await goalRepository.listSettlementsByActivityOverlap(
        input.userId,
        normalizedActivityIds,
        input.startAt,
        input.endAt,
        trx,
      );

      const adjustedSettlementIds: string[] = [];
      for (const settlement of settlements) {
        await lockGoalSettlementPeriod(trx, settlement.goalId, settlement.periodStart, settlement.periodEnd);

        const activityIds = settlement.goal.activities.map((item) => item.activityId);
        const totalMinutes = await goalRepository.sumGoalMinutesInRange(
          input.userId,
          activityIds,
          settlement.periodStart,
          settlement.periodEnd,
          trx,
        );
        const targetMinutes = settlement.targetMinutesSnapshot;
        const isCompletedNow = totalMinutes >= targetMinutes;
        const nextPointDelta = computeSettlementPointDelta({
          isCompleted: isCompletedNow,
          rewardPointsSnapshot: decimalToNumber(settlement.rewardPointsSnapshot),
          penaltyPointsSnapshot: decimalToNumber(settlement.penaltyPointsSnapshot),
          allActivitiesDeleted: areAllGoalActivitiesDeleted(settlement.goal.activities),
        });
        const prevPointDelta = decimalToNumber(settlement.pointDelta);
        const adjustDelta = Number((nextPointDelta - prevPointDelta).toFixed(2));

        if (Math.abs(adjustDelta) >= 0.005) {
          await pointsService.appendTransaction(
            {
              userId: input.userId,
              type: adjustDelta >= 0 ? PointTransactionType.GOAL_REWARD : PointTransactionType.GOAL_PENALTY,
              amount: adjustDelta,
              relatedType: PointRelatedType.GOAL_SETTLEMENT,
              relatedId: settlement.id,
              note: `目标结算修正：${settlement.goal.name} (${totalMinutes}/${targetMinutes} 分钟)`,
              happenedAt: new Date(),
            },
            trx,
          );
        }

        if (Math.abs(adjustDelta) >= 0.005 || settlement.totalMinutes !== totalMinutes || settlement.isCompleted !== isCompletedNow) {
          await goalRepository.updateSettlement(
            {
              where: { id: settlement.id },
              data: {
                totalMinutes,
                isCompleted: isCompletedNow,
                pointDelta: toDecimal(nextPointDelta),
                settledAt: new Date(),
              },
            },
            trx,
          );
          adjustedSettlementIds.push(settlement.id);
        }
      }

      return {
        adjustedCount: adjustedSettlementIds.length,
        adjustedSettlementIds,
      };
    };

    if (tx) {
      return applyReconcile(tx);
    }
    return db.$transaction(async (trx) => applyReconcile(trx));
  },
};
