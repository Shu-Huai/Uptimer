import { z } from "zod";

const nonEmpty = z.string().trim().min(1, "参数不能为空");

export const startTimerSchema = z.object({
  userId: nonEmpty,
  activityId: nonEmpty,
  startedAt: z.date().optional(),
});

export const stopTimerSchema = z.object({
  userId: nonEmpty,
  mode: z.enum(["FINISH", "CANCEL"]),
  endedAt: z.date().optional(),
  note: z.string().trim().max(200, "备注最多 200 个字符").optional(),
});

export const switchTimerActivitySchema = z.object({
  userId: nonEmpty,
  activityId: nonEmpty,
});
