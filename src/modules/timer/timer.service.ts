import type { Prisma } from "@prisma/client";
import { addSeconds } from "date-fns";

import { db } from "@/lib/db";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { recordService } from "@/modules/record/record.service";

import { startTimerSchema, stopTimerSchema, switchTimerActivitySchema } from "./timer.schemas";
import { timerRepository } from "./timer.repository";
import type { StartTimerInput, StopTimerInput, SwitchTimerActivityInput } from "./timer.types";

async function lockUserTimerState(tx: Prisma.TransactionClient, userId: string) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId})::bigint)`;
}

export const timerService = {
  async startTimer(userId: string, activityId: string, startedAt?: Date) {
    const parsed = startTimerSchema.parse({
      userId,
      activityId,
      startedAt,
    });
    const startAt = parsed.startedAt ?? new Date();

    return db.$transaction(async (tx) => {
      await lockUserTimerState(tx, parsed.userId);

      const activity = await timerRepository.findActivity(parsed.userId, parsed.activityId, tx);
      if (!activity) {
        throw new NotFoundError("活动不存在或已禁用");
      }

      const existing = await timerRepository.findRunningSession(parsed.userId, tx);
      if (existing) {
        throw new ConflictError("已有运行中的计时，请先停止当前计时");
      }

      await recordService.assertNoTimeConflict(
        parsed.userId,
        startAt,
        addSeconds(startAt, 1),
        undefined,
        tx,
      );

      return timerRepository.createSession(
        {
          data: {
            userId: parsed.userId,
            activityId: parsed.activityId,
            startedAt: startAt,
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
        },
        tx,
      );
    });
  },

  async getRunningTimer(userId: string) {
    return timerRepository.findRunningSession(userId);
  },

  async stopTimer(userId: string, endedAt?: Date, note?: string) {
    const parsed = stopTimerSchema.parse({
      userId,
      mode: "FINISH",
      endedAt,
      note,
    });

    return db.$transaction(async (tx) => {
      await lockUserTimerState(tx, parsed.userId);

      const running = await timerRepository.findRunningSession(parsed.userId, tx);
      if (!running) {
        throw new NotFoundError("未找到运行中的计时");
      }

      const rawEnd = parsed.endedAt ?? new Date();
      const safeEnd = rawEnd <= running.startedAt ? addSeconds(running.startedAt, 1) : rawEnd;

      const record = await recordService.createInTransaction(
        {
          userId: parsed.userId,
          activityId: running.activityId,
          startAt: running.startedAt,
          endAt: safeEnd,
          source: "TIMER",
          note: parsed.note || "计时生成记录",
        },
        tx,
      );

      const session = await timerRepository.updateSession(
        {
          where: { id: running.id },
          data: {
            status: "FINISHED",
            endedAt: safeEnd,
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
        },
        tx,
      );

      return { session, record };
    });
  },

  async cancelTimer(userId: string, endedAt?: Date) {
    const parsed = stopTimerSchema.parse({
      userId,
      mode: "CANCEL",
      endedAt,
    });

    return db.$transaction(async (tx) => {
      await lockUserTimerState(tx, parsed.userId);

      const running = await timerRepository.findRunningSession(parsed.userId, tx);
      if (!running) {
        throw new NotFoundError("未找到运行中的计时");
      }

      const safeEnd = (parsed.endedAt ?? new Date()) <= running.startedAt
        ? addSeconds(running.startedAt, 1)
        : (parsed.endedAt ?? new Date());

      return timerRepository.updateSession(
        {
          where: { id: running.id },
          data: {
            status: "CANCELED",
            endedAt: safeEnd,
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
        },
        tx,
      );
    });
  },

  async start(input: StartTimerInput) {
    return timerService.startTimer(input.userId, input.activityId, input.startedAt);
  },

  async switchRunningActivity(userId: string, activityId: string) {
    const parsed = switchTimerActivitySchema.parse({
      userId,
      activityId,
    });

    return db.$transaction(async (tx) => {
      await lockUserTimerState(tx, parsed.userId);

      const running = await timerRepository.findRunningSession(parsed.userId, tx);
      if (!running) {
        throw new NotFoundError("未找到运行中的计时");
      }

      const activity = await timerRepository.findActivity(parsed.userId, parsed.activityId, tx);
      if (!activity) {
        throw new NotFoundError("活动不存在或已禁用");
      }

      if (running.activityId === parsed.activityId) {
        return running;
      }

      return timerRepository.updateSession(
        {
          where: { id: running.id },
          data: {
            activityId: parsed.activityId,
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
        },
        tx,
      );
    });
  },

  async getRunningSession(userId: string) {
    return timerService.getRunningTimer(userId);
  },

  async stop(input: StopTimerInput) {
    const parsed = stopTimerSchema.parse(input);
    if (parsed.mode === "CANCEL") {
      return timerService.cancelTimer(parsed.userId, parsed.endedAt);
    }
    return timerService.stopTimer(parsed.userId, parsed.endedAt, parsed.note);
  },

  async switchActivity(input: SwitchTimerActivityInput) {
    return timerService.switchRunningActivity(input.userId, input.activityId);
  },
};
