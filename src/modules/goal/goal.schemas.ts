import { GoalPeriodType } from "@prisma/client";
import { z } from "zod";

const nonEmptyText = z.string().trim().min(1, "该字段不能为空");

export const createGoalSchema = z.object({
  userId: nonEmptyText,
  name: nonEmptyText.max(60, "目标名称最多 60 个字符"),
  note: z.string().trim().max(200, "备注最多 200 个字符").optional(),
  icon: z.string().trim().max(120, "图标最多 120 个字符").optional(),
  periodType: z.nativeEnum(GoalPeriodType),
  targetMinutes: z.coerce.number().int("目标时长必须是整数分钟").min(1, "目标时长必须大于 0"),
  rewardPoints: z.coerce.number().finite().min(0, "奖励积分不能小于 0"),
  penaltyPoints: z.coerce.number().finite().min(0, "惩罚积分不能小于 0"),
  isEnabled: z.coerce.boolean().default(true),
  activityIds: z.array(nonEmptyText).min(1, "至少关联一个活动"),
});

export const updateGoalSchema = createGoalSchema.extend({
  id: nonEmptyText,
});

export const toggleGoalEnabledSchema = z.object({
  userId: nonEmptyText,
  id: nonEmptyText,
  enabled: z.coerce.boolean(),
});
