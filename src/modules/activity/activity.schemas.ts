import { ActivityNature } from "@prisma/client";
import { z } from "zod";

const nonEmptyText = z.string().trim().min(1, "该字段不能为空");

export const createActivitySchema = z.object({
  userId: nonEmptyText,
  name: nonEmptyText.max(50, "活动名最多 50 个字符"),
  note: z.string().trim().max(200, "备注最多 200 个字符").optional(),
  icon: z.string().trim().max(120, "图标最多 120 个字符").optional(),
  nature: z.nativeEnum(ActivityNature),
  rewardRatePerHour: z.coerce.number().finite("回报率格式不正确"),
});

export const updateActivitySchema = createActivitySchema.extend({
  id: nonEmptyText,
});

export const setActivityEnabledSchema = z.object({
  userId: nonEmptyText,
  id: nonEmptyText,
  enabled: z.coerce.boolean(),
});

export const deleteActivitySchema = z.object({
  userId: nonEmptyText,
  id: nonEmptyText,
});
