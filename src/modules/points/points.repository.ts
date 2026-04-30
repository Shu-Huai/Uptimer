import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";

export const pointsRepository = {
  findUserById(userId: string, tx?: Prisma.TransactionClient) {
    return (tx ?? db).user.findUnique({
      where: { id: userId },
      select: { id: true, pointBalance: true },
    });
  },

  updateUserBalance(userId: string, pointBalance: Prisma.Decimal, tx?: Prisma.TransactionClient) {
    return (tx ?? db).user.update({
      where: { id: userId },
      data: { pointBalance },
      select: { id: true, pointBalance: true },
    });
  },

  incrementUserBalance(userId: string, amount: Prisma.Decimal, tx?: Prisma.TransactionClient) {
    return (tx ?? db).user.update({
      where: { id: userId },
      data: {
        pointBalance: {
          increment: amount,
        },
      },
      select: { id: true, pointBalance: true },
    });
  },

  createTransaction(args: Prisma.PointTransactionCreateArgs, tx?: Prisma.TransactionClient) {
    return (tx ?? db).pointTransaction.create(args);
  },

  listTransactions(userId: string) {
    return db.pointTransaction.findMany({
      where: { userId },
      orderBy: { happenedAt: "desc" },
      take: 100,
    });
  },

  listByRange(userId: string, start: Date, end: Date) {
    return db.pointTransaction.findMany({
      where: {
        userId,
        happenedAt: {
          gte: start,
          lt: end,
        },
      },
      orderBy: { happenedAt: "asc" },
    });
  },
};
