import { ActivityNature, Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { toDecimal } from "@/lib/utils";

import {
  createActivitySchema,
  deleteActivitySchema,
  setActivityEnabledSchema,
  updateActivitySchema,
} from "./activity.schemas";
import { activityRepository } from "./activity.repository";
import type {
  CreateActivityInput,
  DeleteActivityInput,
  SetActivityEnabledInput,
  UpdateActivityInput,
} from "./activity.types";

function buildDeletedActivityName(name: string, id: string): string {
  return `${name}__deleted__${id}`;
}

function validateNatureAndRate(nature: ActivityNature, rewardRatePerHour: number) {
  if (nature === ActivityNature.POSITIVE && rewardRatePerHour < 0) {
    throw new ValidationError("积极活动的回报率不能为负数");
  }

  if (nature === ActivityNature.NEGATIVE && rewardRatePerHour > 0) {
    throw new ValidationError("消极活动的回报率不能为正数");
  }
}

async function ensureUniqueName(userId: string, name: string, excludeId?: string, tx?: Prisma.TransactionClient) {
  const existing = await activityRepository.findByUserAndName(userId, name, excludeId, tx);
  if (existing) {
    if (existing.isEnabled) {
      throw new ConflictError("该活动名称已存在");
    }
    await activityRepository.update(
      {
        where: { id: existing.id },
        data: { name: buildDeletedActivityName(existing.name, existing.id) },
      },
      tx,
    );
  }
}

export const activityService = {
  async create(input: CreateActivityInput) {
    const parsed = createActivitySchema.parse(input);
    validateNatureAndRate(parsed.nature, parsed.rewardRatePerHour);

    return db.$transaction(async (tx) => {
      await ensureUniqueName(parsed.userId, parsed.name, undefined, tx);
      return activityRepository.create(
        {
          data: {
            userId: parsed.userId,
            name: parsed.name,
            note: parsed.note,
            icon: parsed.icon,
            nature: parsed.nature,
            rewardRatePerHour: toDecimal(parsed.rewardRatePerHour),
          },
        },
        tx,
      );
    });
  },

  async update(input: UpdateActivityInput) {
    const parsed = updateActivitySchema.parse(input);
    validateNatureAndRate(parsed.nature, parsed.rewardRatePerHour);

    return db.$transaction(async (tx) => {
      await ensureUniqueName(parsed.userId, parsed.name, parsed.id, tx);

      const existing = await activityRepository.findById(parsed.id, tx);
      if (!existing || existing.userId !== parsed.userId) {
        throw new NotFoundError("活动不存在");
      }

      return activityRepository.update(
        {
          where: { id: parsed.id },
          data: {
            name: parsed.name,
            note: parsed.note,
            icon: parsed.icon,
            nature: parsed.nature,
            rewardRatePerHour: toDecimal(parsed.rewardRatePerHour),
          },
        },
        tx,
      );
    });
  },

  async setEnabled(input: SetActivityEnabledInput) {
    const parsed = setActivityEnabledSchema.parse(input);

    const existing = await activityRepository.findByUserAndId(parsed.userId, parsed.id);
    if (!existing) {
      throw new NotFoundError("活动不存在");
    }

    return activityRepository.update({
      where: { id: parsed.id },
      data: { isEnabled: parsed.enabled },
    });
  },

  async delete(input: DeleteActivityInput) {
    const parsed = deleteActivitySchema.parse(input);

    const existing = await activityRepository.findByUserAndId(parsed.userId, parsed.id);
    if (!existing) {
      throw new NotFoundError("活动不存在");
    }

    return activityRepository.update({
      where: { id: parsed.id },
      data: {
        isEnabled: false,
        name: buildDeletedActivityName(existing.name, existing.id),
      },
    });
  },

  async getById(userId: string, id: string) {
    const activity = await activityRepository.findByUserAndId(userId, id);
    if (!activity) {
      throw new NotFoundError("活动不存在");
    }
    return activity;
  },

  async list(userId: string) {
    return activityRepository.listByUser(userId);
  },

  async listEnabled(userId: string) {
    return activityRepository.listEnabledByUser(userId);
  },

};
