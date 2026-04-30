import type { GoalPeriodType } from "@prisma/client";

export type CreateGoalInput = {
  userId: string;
  name: string;
  note?: string;
  icon?: string;
  periodType: GoalPeriodType;
  targetMinutes: number;
  rewardPoints: number;
  penaltyPoints: number;
  isEnabled?: boolean;
  activityIds: string[];
};

export type UpdateGoalInput = CreateGoalInput & {
  id: string;
};

export type ToggleGoalEnabledInput = {
  userId: string;
  id: string;
  enabled: boolean;
};

export type GoalProgressView = {
  goalId: string;
  currentMinutes: number;
  targetMinutes: number;
  progressPercent: number;
  isCompletedPreview: boolean;
  periodStart: Date;
  periodEnd: Date;
};

export type RollbackGoalSettlementByRecordDeleteInput = {
  userId: string;
  activityId: string;
  startAt: Date;
  endAt: Date;
};

export type ReconcileGoalSettlementsByRecordMutationInput = {
  userId: string;
  activityIds: string[];
  startAt: Date;
  endAt: Date;
};
