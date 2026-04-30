import type { PointRelatedType, PointTransactionType } from "@prisma/client";

export type CreatePointTransactionInput = {
  userId: string;
  type: PointTransactionType;
  amount: number;
  relatedType: PointRelatedType;
  relatedId: string;
  note?: string;
  happenedAt?: Date;
};
