import { PointRelatedType, PointTransactionType, RecordSource } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { differenceInMinutes, max, min } from "date-fns";

import { db } from "@/lib/db";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { getDayRange } from "@/lib/time";
import { decimalToNumber, toDecimal } from "@/lib/utils";
import { activityRepository } from "@/modules/activity/activity.repository";
import { goalService } from "@/modules/goal/goal.service";
import { pointsService } from "@/modules/points/points.service";

import { createManualRecordSchema, createRecordSchema, deleteManualRecordSchema, updateManualRecordSchema } from "./record.schemas";
import type { CreateManualRecordInput, CreateRecordInput, DeleteManualRecordInput, UpdateManualRecordInput } from "./record.types";
import { recordRepository } from "./record.repository";

type NormalizedCreateRecordInput = {
  userId: string;
  activityId: string;
  startAt: Date;
  endAt: Date;
  source: RecordSource;
  note?: string | null;
};

function computeDurationMinutes(startAt: Date, endAt: Date): number {
  const duration = differenceInMinutes(endAt, startAt);
  return duration > 0 ? duration : 1;
}

function computePointDelta(rewardRatePerHour: number, durationMinutes: number): number {
  return Number(((rewardRatePerHour * durationMinutes) / 60).toFixed(2));
}

async function ensureNoTimeConflict(
  userId: string,
  startAt: Date,
  endAt: Date,
  excludeId?: string,
  tx?: Prisma.TransactionClient,
) {
  const conflict = await recordRepository.findOverlappingRecord({
    userId,
    startAt,
    endAt,
    excludeId,
  }, tx);

  if (conflict) {
    throw new ConflictError(
      `时间与已有记录冲突：${conflict.activityNameSnapshot} (${conflict.startAt.toLocaleString()} - ${conflict.endAt.toLocaleString()})`,
    );
  }
}

async function lockUserRecordTimeline(
  tx: Prisma.TransactionClient,
  userId: string,
) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId})::bigint)`;
}

async function createRecordInTransaction(
  input: NormalizedCreateRecordInput,
  tx: Prisma.TransactionClient,
) {
  const activity = await activityRepository.findById(input.activityId, tx);
  if (!activity || activity.userId !== input.userId) {
    throw new NotFoundError("活动不存在");
  }

  const durationMinutes = computeDurationMinutes(input.startAt, input.endAt);
  const rewardRate = decimalToNumber(activity.rewardRatePerHour);
  const pointDelta = computePointDelta(rewardRate, durationMinutes);

  await lockUserRecordTimeline(tx, input.userId);
  await ensureNoTimeConflict(input.userId, input.startAt, input.endAt, undefined, tx);

  const record = await recordRepository.create(
    {
      data: {
        userId: input.userId,
        activityId: input.activityId,
        startAt: input.startAt,
        endAt: input.endAt,
        durationMinutes,
        source: input.source,
        note: input.note,
        activityNameSnapshot: activity.name,
        activityNatureSnapshot: activity.nature,
        rewardRateSnapshot: toDecimal(rewardRate),
        pointDelta: toDecimal(pointDelta),
      },
    },
    tx,
  );

  await pointsService.appendTransaction(
    {
      userId: input.userId,
      type: PointTransactionType.RECORD_EARN,
      amount: pointDelta,
      relatedType: PointRelatedType.RECORD,
      relatedId: record.id,
      note: `记录结算：${activity.name} ${durationMinutes} 分钟`,
      happenedAt: input.endAt,
    },
    tx,
  );

  await goalService.reconcileSettlementsByRecordMutation(
    {
      userId: input.userId,
      activityIds: [input.activityId],
      startAt: input.startAt,
      endAt: input.endAt,
    },
    tx,
  );

  return record;
}

export const recordService = {
  async assertNoTimeConflict(
    userId: string,
    startAt: Date,
    endAt: Date,
    excludeId?: string,
    tx?: Prisma.TransactionClient,
  ) {
    await ensureNoTimeConflict(userId, startAt, endAt, excludeId, tx);
  },

  async createInTransaction(
    input: CreateRecordInput,
    tx: Prisma.TransactionClient,
  ) {
    const parsed = createRecordSchema.parse(input);
    return createRecordInTransaction(parsed, tx);
  },

  async create(input: CreateRecordInput) {
    const parsed = createRecordSchema.parse(input);
    return db.$transaction(async (tx) => createRecordInTransaction(parsed, tx));
  },

  async createManual(input: CreateManualRecordInput) {
    const parsed = createManualRecordSchema.parse(input);
    return recordService.create({
      ...parsed,
      source: RecordSource.MANUAL,
    });
  },

  async updateManual(input: UpdateManualRecordInput) {
    const parsed = updateManualRecordSchema.parse(input);

    return db.$transaction(async (tx) => {
      await lockUserRecordTimeline(tx, parsed.userId);

      const existing = await recordRepository.findByUserAndId(parsed.userId, parsed.id, tx);
      if (!existing) {
        throw new NotFoundError("记录不存在");
      }

      const activity = await activityRepository.findById(parsed.activityId, tx);
      if (!activity || activity.userId !== parsed.userId) {
        throw new NotFoundError("活动不存在");
      }

      await ensureNoTimeConflict(parsed.userId, parsed.startAt, parsed.endAt, parsed.id, tx);

      const durationMinutes = computeDurationMinutes(parsed.startAt, parsed.endAt);
      const rewardRate = decimalToNumber(activity.rewardRatePerHour);
      const nextPointDelta = computePointDelta(rewardRate, durationMinutes);
      const prevPointDelta = decimalToNumber(existing.pointDelta);
      const adjustDelta = Number((nextPointDelta - prevPointDelta).toFixed(2));

      const record = await recordRepository.update(
        {
          where: { id: parsed.id },
          data: {
            activityId: parsed.activityId,
            startAt: parsed.startAt,
            endAt: parsed.endAt,
            durationMinutes,
            note: parsed.note,
            activityNameSnapshot: activity.name,
            activityNatureSnapshot: activity.nature,
            rewardRateSnapshot: toDecimal(rewardRate),
            pointDelta: toDecimal(nextPointDelta),
          },
        },
        tx,
      );

      if (Math.abs(adjustDelta) >= 0.005) {
        await pointsService.appendTransaction(
          {
            userId: parsed.userId,
            type: PointTransactionType.RECORD_EARN,
            amount: adjustDelta,
            relatedType: PointRelatedType.RECORD,
            relatedId: parsed.id,
            note: `记录修改调整：${activity.name} ${durationMinutes} 分钟`,
            happenedAt: parsed.endAt,
          },
          tx,
        );
      }

      const reconcileStart = existing.startAt < parsed.startAt ? existing.startAt : parsed.startAt;
      const reconcileEnd = existing.endAt > parsed.endAt ? existing.endAt : parsed.endAt;
      await goalService.reconcileSettlementsByRecordMutation(
        {
          userId: parsed.userId,
          activityIds: [existing.activityId, parsed.activityId],
          startAt: reconcileStart,
          endAt: reconcileEnd,
        },
        tx,
      );

      return record;
    });
  },

  async deleteManual(input: DeleteManualRecordInput) {
    const parsed = deleteManualRecordSchema.parse(input);

    return db.$transaction(async (tx) => {
      await lockUserRecordTimeline(tx, parsed.userId);

      const existing = await recordRepository.findByUserAndId(parsed.userId, parsed.id, tx);
      if (!existing) {
        throw new NotFoundError("记录不存在");
      }

      await recordRepository.delete(
        {
          where: { id: parsed.id },
        },
        tx,
      );

      const rollbackAmount = Number((-decimalToNumber(existing.pointDelta)).toFixed(2));
      if (Math.abs(rollbackAmount) >= 0.005) {
        await pointsService.appendTransaction(
          {
            userId: parsed.userId,
            type: PointTransactionType.RECORD_EARN,
            amount: rollbackAmount,
            relatedType: PointRelatedType.RECORD,
            relatedId: parsed.id,
            note: `记录删除回滚：${existing.activityNameSnapshot} ${existing.durationMinutes} 分钟`,
            happenedAt: new Date(),
          },
          tx,
        );
      }

      await goalService.reconcileSettlementsByRecordMutation(
        {
          userId: parsed.userId,
          activityIds: [existing.activityId],
          startAt: existing.startAt,
          endAt: existing.endAt,
        },
        tx,
      );

      return {
        id: parsed.id,
        rollbackAmount,
      };
    });
  },

  async listByDay(userId: string, day: Date) {
    const range = getDayRange(day);
    const records = await recordRepository.listByRange(userId, range.start, range.end);

    const gaps: Array<{ startAt: Date; endAt: Date; durationMinutes: number }> = [];
    let cursor = range.start;

    for (const item of records) {
      const recordStart = max([item.startAt, range.start]);
      const recordEnd = min([item.endAt, range.end]);

      if (cursor < recordStart) {
        gaps.push({
          startAt: cursor,
          endAt: recordStart,
          durationMinutes: computeDurationMinutes(cursor, recordStart),
        });
      }

      if (recordEnd > cursor) {
        cursor = recordEnd;
      }
    }

    if (cursor < range.end) {
      gaps.push({
        startAt: cursor,
        endAt: range.end,
        durationMinutes: computeDurationMinutes(cursor, range.end),
      });
    }

    return { records, gaps, range };
  },

  async getDaySummary(userId: string, day: Date) {
    const { records } = await recordService.listByDay(userId, day);
    const durationMinutes = records.reduce((sum, item) => sum + item.durationMinutes, 0);
    const earned = records.reduce((sum, item) => {
      const value = decimalToNumber(item.pointDelta);
      return value > 0 ? sum + value : sum;
    }, 0);
    const lost = records.reduce((sum, item) => {
      const value = decimalToNumber(item.pointDelta);
      return value < 0 ? sum + Math.abs(value) : sum;
    }, 0);

    return {
      durationMinutes,
      earned: Number(earned.toFixed(2)),
      lost: Number(lost.toFixed(2)),
      net: Number((earned - lost).toFixed(2)),
    };
  },
};
