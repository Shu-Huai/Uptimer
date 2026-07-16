import { RecordSource } from "@prisma/client";
import { z } from "zod";

const textField = z.string().trim().min(1, "该字段不能为空");

const baseRecordSchema = z.object({
  userId: textField,
  activityId: textField,
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
  note: z.string().trim().max(200, "备注最多 200 个字符").nullable().optional(),
});

export const createRecordSchema = baseRecordSchema
  .extend({
    source: z.nativeEnum(RecordSource),
  })
  .refine((value) => value.startAt < value.endAt, {
    path: ["endAt"],
    message: "结束时间必须晚于开始时间",
  });

export const createManualRecordSchema = baseRecordSchema.refine(
  (value) => value.startAt < value.endAt,
  {
    path: ["endAt"],
    message: "结束时间必须晚于开始时间",
  },
);

export const updateManualRecordSchema = baseRecordSchema
  .extend({
    id: textField,
  })
  .refine((value) => value.startAt < value.endAt, {
    path: ["endAt"],
    message: "结束时间必须晚于开始时间",
  });

export const deleteManualRecordSchema = z.object({
  userId: textField,
  id: textField,
});
