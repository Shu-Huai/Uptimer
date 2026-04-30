import { PointRelatedType, PointTransactionType, StockMode } from "@prisma/client";

import { db } from "@/lib/db";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { decimalToNumber, toDecimal } from "@/lib/utils";

import { createRewardSchema, deleteRewardSchema, redeemRewardSchema, updateRewardSchema } from "./reward.schemas";
import { rewardRepository } from "./reward.repository";
import type {
  CreateRewardInput,
  DeleteRewardInput,
  ParsedStock,
  RedeemRewardInput,
  UpdateRewardInput,
} from "./reward.types";

function parseStock(stockInput: number | undefined): ParsedStock {
  if (stockInput === undefined) {
    return {
      stockMode: StockMode.UNLIMITED,
      stock: null,
    };
  }

  return {
    stockMode: StockMode.LIMITED,
    stock: stockInput,
  };
}

function calcTimeValuePerHour(totalPoints: number, totalMinutes: number) {
  if (totalMinutes <= 0) return null;
  return Number(((totalPoints / totalMinutes) * 60).toFixed(2));
}

export const rewardService = {
  async create(input: CreateRewardInput) {
    const parsed = createRewardSchema.parse(input);
    const stock = parseStock(parsed.stockInput);

    return rewardRepository.createRewardItem({
      data: {
        userId: parsed.userId,
        name: parsed.name,
        note: parsed.note,
        icon: parsed.icon,
        color: "#2a9df4",
        pricePoints: toDecimal(parsed.pricePoints),
        stockMode: stock.stockMode,
        stock: stock.stock,
        isEnabled: true,
      },
    });
  },

  async update(input: UpdateRewardInput) {
    const parsed = updateRewardSchema.parse(input);
    const existing = await rewardRepository.findRewardItemByUserAndId(parsed.userId, parsed.id);
    if (!existing) {
      throw new NotFoundError("商品不存在");
    }
    const stock = parseStock(parsed.stockInput);

    return rewardRepository.updateRewardItem({
      where: { id: parsed.id },
      data: {
        name: parsed.name,
        note: parsed.note,
        icon: parsed.icon,
        color: "#2a9df4",
        pricePoints: toDecimal(parsed.pricePoints),
        stockMode: stock.stockMode,
        stock: stock.stock,
        isEnabled: true,
      },
    });
  },

  async remove(input: DeleteRewardInput) {
    const parsed = deleteRewardSchema.parse(input);
    const existing = await rewardRepository.findRewardItemByUserAndId(parsed.userId, parsed.id);
    if (!existing) {
      throw new NotFoundError("商品不存在");
    }

    try {
      return await rewardRepository.deleteRewardItem({
        where: { id: parsed.id },
      });
    } catch {
      throw new ConflictError("商品已有兑换记录，无法删除");
    }
  },

  async getById(userId: string, rewardId: string) {
    const reward = await rewardRepository.findRewardItemByUserAndId(userId, rewardId);
    if (!reward) {
      throw new NotFoundError("商品不存在");
    }
    return reward;
  },

  async getRewardsPageData(userId: string) {
    const [items, redemptionCount, user, recordsSummary] = await Promise.all([
      rewardRepository.listRewardItemsByUser(userId),
      rewardRepository.countRedemptionsByUser(userId),
      rewardRepository.findUserPointBalance(userId),
      rewardRepository.sumRecordsForTimeValue(userId),
    ]);

    if (!user) {
      throw new NotFoundError("默认用户不存在，请先执行 seed");
    }

    const totalMinutes = recordsSummary._sum.durationMinutes ?? 0;
    const totalPoints = decimalToNumber(recordsSummary._sum.pointDelta ?? 0);
    const timeValuePerHour = calcTimeValuePerHour(totalPoints, totalMinutes);

    return {
      items,
      stats: {
        itemCount: items.length,
        pointBalance: user.pointBalance,
        redemptionCount,
        timeValuePerHour,
      },
    };
  },

  async redeem(input: RedeemRewardInput) {
    const parsed = redeemRewardSchema.parse(input);

    return db.$transaction(async (tx) => {
      await rewardRepository.executeAdvisoryLock(`reward-redeem:${parsed.userId}`, tx);
      await rewardRepository.executeAdvisoryLock(`reward-redeem-item:${parsed.rewardItemId}`, tx);

      const [reward, user] = await Promise.all([
        rewardRepository.findRewardItemByUserAndId(parsed.userId, parsed.rewardItemId, tx),
        rewardRepository.findUserPointBalance(parsed.userId, tx),
      ]);

      if (!reward) {
        throw new NotFoundError("商品不存在");
      }
      if (!user) {
        throw new NotFoundError("默认用户不存在，请先执行 seed");
      }
      if (reward.stockMode === StockMode.LIMITED && (reward.stock ?? 0) <= 0) {
        throw new ValidationError("库存不足，暂不可兑换");
      }

      const balance = decimalToNumber(user.pointBalance);
      const price = decimalToNumber(reward.pricePoints);
      if (balance < price) {
        throw new ValidationError("积分不足");
      }

      const updatedUser = await tx.user.update({
        where: { id: parsed.userId },
        data: {
          pointBalance: {
            decrement: toDecimal(price),
          },
        },
        select: { pointBalance: true },
      });

      if (reward.stockMode === StockMode.LIMITED) {
        await rewardRepository.updateRewardItem(
          {
            where: { id: reward.id },
            data: {
              stock: {
                decrement: 1,
              },
            },
          },
          tx,
        );
      }

      const redemption = await rewardRepository.createRedemption(
        {
          data: {
            userId: parsed.userId,
            rewardItemId: reward.id,
            priceSnapshot: reward.pricePoints,
            pointDelta: toDecimal(-price),
          },
        },
        tx,
      );

      await rewardRepository.createPointTransaction(
        {
          data: {
            userId: parsed.userId,
            type: PointTransactionType.REWARD_REDEEM,
            amount: toDecimal(-price),
            balanceAfter: updatedUser.pointBalance,
            relatedType: PointRelatedType.REDEMPTION,
            relatedId: redemption.id,
            note: `兑换商品：${reward.name}`,
          },
        },
        tx,
      );

      return redemption;
    });
  },
};
