import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";

export const timerRepository = {
  findActivity(userId: string, activityId: string, tx?: Prisma.TransactionClient) {
    return (tx ?? db).activity.findFirst({
      where: {
        id: activityId,
        userId,
        isEnabled: true,
      },
      select: {
        id: true,
        name: true,
        icon: true,
        rewardRatePerHour: true,
      },
    });
  },

  findRunningSession(userId: string, tx?: Prisma.TransactionClient) {
    return (tx ?? db).timerSession.findFirst({
      where: {
        userId,
        status: "RUNNING",
      },
      include: {
        activity: {
          select: {
            id: true,
            name: true,
            icon: true,
            rewardRatePerHour: true,
          },
        },
      },
      orderBy: { startedAt: "desc" },
    });
  },

  createSession(args: Prisma.TimerSessionCreateArgs, tx?: Prisma.TransactionClient) {
    return (tx ?? db).timerSession.create(args);
  },

  updateSession(args: Prisma.TimerSessionUpdateArgs, tx?: Prisma.TransactionClient) {
    return (tx ?? db).timerSession.update(args);
  },
};
