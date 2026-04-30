import { z } from "zod";

const nonEmptyText = z.string().trim().min(1, "该字段不能为空");

const stockInputSchema = z.preprocess((value) => {
  if (value === null || value === undefined || value === "") return undefined;
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return value;
}, z.number().int("库存必须是整数").min(0, "库存不能小于 0").optional());

export const createRewardSchema = z.object({
  userId: nonEmptyText,
  name: nonEmptyText.max(60, "商品名称最多 60 个字符"),
  note: z.string().trim().max(300, "备注最多 300 个字符").optional(),
  icon: z.string().trim().max(120, "图标最多 120 个字符").optional(),
  pricePoints: z.coerce.number().finite().positive("所需积分必须大于 0"),
  stockInput: stockInputSchema,
});

export const updateRewardSchema = createRewardSchema.extend({
  id: nonEmptyText,
});

export const redeemRewardSchema = z.object({
  userId: nonEmptyText,
  rewardItemId: nonEmptyText,
});

export const deleteRewardSchema = z.object({
  userId: nonEmptyText,
  id: nonEmptyText,
});
