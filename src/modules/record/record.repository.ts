import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";

type TimeConflictArgs = {
  userId: string;
  startAt: Date;
  endAt: Date;
  excludeId?: string;
};

export const recordRepository = {
  findOverlappingRecord(args: TimeConflictArgs, tx?: Prisma.TransactionClient) {
    return (tx ?? db).record.findFirst({
      where: {
        userId: args.userId,
        id: args.excludeId ? { not: args.excludeId } : undefined,
        startAt: { lt: args.endAt },
        endAt: { gt: args.startAt },
      },
      select: {
        id: true,
        startAt: true,
        endAt: true,
        activityNameSnapshot: true,
      },
    });
  },

  create(args: Prisma.RecordCreateArgs, tx?: Prisma.TransactionClient) {
    return (tx ?? db).record.create(args);
  },

  update(args: Prisma.RecordUpdateArgs, tx?: Prisma.TransactionClient) {
    return (tx ?? db).record.update(args);
  },

  delete(args: Prisma.RecordDeleteArgs, tx?: Prisma.TransactionClient) {
    return (tx ?? db).record.delete(args);
  },

  findByUserAndId(userId: string, id: string, tx?: Prisma.TransactionClient) {
    return (tx ?? db).record.findFirst({
      where: { userId, id },
    });
  },

  listByRange(userId: string, start: Date, end: Date) {
    return db.record.findMany({
      where: {
        userId,
        startAt: { lt: end },
        endAt: { gt: start },
      },
      include: {
        activity: {
          select: {
            id: true,
            isEnabled: true,
          },
        },
      },
      orderBy: { startAt: "asc" },
    });
  },

  listByUserAndIds(userId: string, ids: string[]) {
    if (!ids.length) return Promise.resolve([]);

    return db.record.findMany({
      where: {
        userId,
        id: { in: ids },
      },
      include: {
        activity: {
          select: {
            id: true,
            isEnabled: true,
          },
        },
      },
    });
  },
};
