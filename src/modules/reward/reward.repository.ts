import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";

export const rewardRepository = {
  createRewardItem(args: Prisma.RewardItemCreateArgs, tx?: Prisma.TransactionClient) {
    return (tx ?? db).rewardItem.create(args);
  },

  updateRewardItem(args: Prisma.RewardItemUpdateArgs, tx?: Prisma.TransactionClient) {
    return (tx ?? db).rewardItem.update(args);
  },

  deleteRewardItem(args: Prisma.RewardItemDeleteArgs, tx?: Prisma.TransactionClient) {
    return (tx ?? db).rewardItem.delete(args);
  },

  findRewardItemByUserAndId(userId: string, id: string, tx?: Prisma.TransactionClient) {
    return (tx ?? db).rewardItem.findFirst({
      where: { userId, id },
    });
  },

  listRewardItemsByUser(userId: string) {
    return db.rewardItem.findMany({
      where: { userId },
      orderBy: [{ createdAt: "desc" }],
    });
  },

  countEnabledRewardItems(userId: string) {
    return db.rewardItem.count({
      where: { userId, isEnabled: true },
    });
  },

  countRedemptionsByUser(userId: string) {
    return db.redemption.count({
      where: { userId },
    });
  },

  findUserPointBalance(userId: string, tx?: Prisma.TransactionClient) {
    return (tx ?? db).user.findUnique({
      where: { id: userId },
      select: { id: true, pointBalance: true },
    });
  },

  sumRecordsForTimeValue(userId: string) {
    return db.record.aggregate({
      where: { userId },
      _sum: {
        durationMinutes: true,
        pointDelta: true,
      },
    });
  },

  createRedemption(args: Prisma.RedemptionCreateArgs, tx?: Prisma.TransactionClient) {
    return (tx ?? db).redemption.create(args);
  },

  createPointTransaction(args: Prisma.PointTransactionCreateArgs, tx?: Prisma.TransactionClient) {
    return (tx ?? db).pointTransaction.create(args);
  },

  executeAdvisoryLock(lockKey: string, tx: Prisma.TransactionClient) {
    return tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey})::bigint)`;
  },
};
