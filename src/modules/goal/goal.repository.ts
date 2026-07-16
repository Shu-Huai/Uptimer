import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";

export const goalRepository = {
  createGoal(args: Prisma.GoalCreateArgs, tx?: Prisma.TransactionClient) {
    return (tx ?? db).goal.create(args);
  },

  updateGoal(args: Prisma.GoalUpdateArgs, tx?: Prisma.TransactionClient) {
    return (tx ?? db).goal.update(args);
  },

  findGoalByUserAndId(userId: string, id: string, tx?: Prisma.TransactionClient) {
    return (tx ?? db).goal.findFirst({
      where: { userId, id },
      include: {
        activities: {
          include: {
            activity: {
              select: { id: true, name: true, isEnabled: true, icon: true },
            },
          },
        },
      },
    });
  },

  listGoalsByUser(userId: string) {
    return db.goal.findMany({
      where: { userId },
      include: {
        activities: {
          include: {
            activity: {
              select: { id: true, name: true, isEnabled: true, icon: true },
            },
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
    });
  },

  listEnabledGoalsForSettlement(userId?: string) {
    return db.goal.findMany({
      where: {
        isEnabled: true,
        ...(userId ? { userId } : {}),
      },
      include: {
        activities: {
          include: {
            activity: {
              select: {
                id: true,
                isEnabled: true,
              },
            },
          },
        },
      },
    });
  },

  deleteGoalActivities(goalId: string, tx?: Prisma.TransactionClient) {
    return (tx ?? db).goalActivity.deleteMany({
      where: { goalId },
    });
  },

  createGoalActivities(goalId: string, activityIds: string[], tx?: Prisma.TransactionClient) {
    return (tx ?? db).goalActivity.createMany({
      data: activityIds.map((activityId) => ({ goalId, activityId })),
      skipDuplicates: true,
    });
  },

  sumGoalMinutesInRange(userId: string, activityIds: string[], periodStart: Date, periodEnd: Date, tx?: Prisma.TransactionClient) {
    if (!activityIds.length) return Promise.resolve(0);

    return (tx ?? db).record
      .aggregate({
        where: {
          userId,
          activityId: { in: activityIds },
          startAt: {
            gte: periodStart,
            lt: periodEnd,
          },
        },
        _sum: {
          durationMinutes: true,
        },
      })
      .then((result) => result._sum.durationMinutes ?? 0);
  },

  findSettlementByUnique(goalId: string, periodStart: Date, periodEnd: Date, tx?: Prisma.TransactionClient) {
    return (tx ?? db).goalSettlement.findUnique({
      where: {
        goalId_periodStart_periodEnd: {
          goalId,
          periodStart,
          periodEnd,
        },
      },
      select: { id: true },
    });
  },

  createSettlement(args: Prisma.GoalSettlementCreateArgs, tx?: Prisma.TransactionClient) {
    return (tx ?? db).goalSettlement.create(args);
  },

  updateSettlement(args: Prisma.GoalSettlementUpdateArgs, tx?: Prisma.TransactionClient) {
    return (tx ?? db).goalSettlement.update(args);
  },

  findSettlementByUserAndId(userId: string, goalId: string, settlementId: string, tx?: Prisma.TransactionClient) {
    return (tx ?? db).goalSettlement.findFirst({
      where: { id: settlementId, userId, goalId },
      include: { goal: { select: { name: true } } },
    });
  },

  deleteSettlement(settlementId: string, tx?: Prisma.TransactionClient) {
    return (tx ?? db).goalSettlement.delete({ where: { id: settlementId } });
  },

  listSettlementsByActivityOverlap(
    userId: string,
    activityIds: string[],
    startAt: Date,
    endAt: Date,
    tx?: Prisma.TransactionClient,
  ) {
    if (!activityIds.length) return Promise.resolve([]);

    return (tx ?? db).goalSettlement.findMany({
      where: {
        userId,
        periodStart: { lt: endAt },
        periodEnd: { gt: startAt },
        goal: {
          activities: {
            some: {
              activityId: { in: activityIds },
            },
          },
        },
      },
      include: {
        goal: {
          include: {
            activities: {
              include: {
                activity: {
                  select: {
                    id: true,
                    isEnabled: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [{ periodStart: "asc" }],
    });
  },

  listGoalSettlementHistory(userId: string, goalId: string) {
    return db.goalSettlement.findMany({
      where: { userId, goalId },
      orderBy: [{ periodStart: "desc" }, { settledAt: "desc" }],
      take: 100,
    });
  },
};
