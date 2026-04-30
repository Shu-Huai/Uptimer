import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";

export const activityRepository = {
  create(args: Prisma.ActivityCreateArgs, tx?: Prisma.TransactionClient) {
    return (tx ?? db).activity.create(args);
  },

  update(args: Prisma.ActivityUpdateArgs, tx?: Prisma.TransactionClient) {
    return (tx ?? db).activity.update(args);
  },

  delete(args: Prisma.ActivityDeleteArgs, tx?: Prisma.TransactionClient) {
    return (tx ?? db).activity.delete(args);
  },

  findById(id: string, tx?: Prisma.TransactionClient) {
    return (tx ?? db).activity.findUnique({
      where: { id },
    });
  },

  findByUserAndId(userId: string, id: string, tx?: Prisma.TransactionClient) {
    return (tx ?? db).activity.findFirst({
      where: { userId, id },
    });
  },

  findByUserAndName(userId: string, name: string, excludeId?: string, tx?: Prisma.TransactionClient) {
    return (tx ?? db).activity.findFirst({
      where: {
        userId,
        name,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true, name: true, isEnabled: true },
    });
  },

  listByUser(userId: string) {
    return db.activity.findMany({
      where: { userId },
      orderBy: [{ isEnabled: "desc" }, { createdAt: "desc" }],
    });
  },

  listEnabledByUser(userId: string) {
    return db.activity.findMany({
      where: { userId, isEnabled: true },
      orderBy: { name: "asc" },
    });
  },

  listByUserAndIds(userId: string, ids: string[], tx?: Prisma.TransactionClient) {
    return (tx ?? db).activity.findMany({
      where: {
        userId,
        id: { in: ids },
      },
      select: {
        id: true,
        isEnabled: true,
        name: true,
      },
    });
  },

  countRecordsByActivity(activityId: string, tx?: Prisma.TransactionClient) {
    return (tx ?? db).record.count({
      where: { activityId },
    });
  },

  countGoalRelationsByActivity(activityId: string, tx?: Prisma.TransactionClient) {
    return (tx ?? db).goalActivity.count({
      where: { activityId },
    });
  },

  countRunningTimersByActivity(activityId: string, tx?: Prisma.TransactionClient) {
    return (tx ?? db).timerSession.count({
      where: { activityId },
    });
  },
};
