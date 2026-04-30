import type { Prisma } from "@prisma/client";

import { NotFoundError } from "@/lib/errors";
import { getDayRange } from "@/lib/time";
import { decimalToNumber, toDecimal } from "@/lib/utils";

import { pointsRepository } from "./points.repository";
import type { CreatePointTransactionInput } from "./points.types";

export const pointsService = {
  async appendTransaction(input: CreatePointTransactionInput, tx?: Prisma.TransactionClient) {
    const user = await pointsRepository.findUserById(input.userId, tx);
    if (!user) {
      throw new NotFoundError("默认用户不存在，请先执行 seed");
    }

    const updated = await pointsRepository.incrementUserBalance(
      input.userId,
      toDecimal(input.amount),
      tx,
    );

    return pointsRepository.createTransaction(
      {
        data: {
          userId: input.userId,
          type: input.type,
          amount: toDecimal(input.amount),
          balanceAfter: updated.pointBalance,
          relatedType: input.relatedType,
          relatedId: input.relatedId,
          note: input.note,
          happenedAt: input.happenedAt ?? new Date(),
        },
      },
      tx,
    );
  },

  async getBalance(userId: string) {
    const user = await pointsRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundError("默认用户不存在，请先执行 seed");
    }

    return user.pointBalance;
  },

  async listTransactions(userId: string) {
    return pointsRepository.listTransactions(userId);
  },

  async getDaySummary(userId: string, day: Date) {
    const range = getDayRange(day);
    const txList = await pointsRepository.listByRange(userId, range.start, range.end);

    const earned = txList.reduce((sum, tx) => {
      const value = decimalToNumber(tx.amount);
      return value > 0 ? sum + value : sum;
    }, 0);

    const lost = txList.reduce((sum, tx) => {
      const value = decimalToNumber(tx.amount);
      return value < 0 ? sum + Math.abs(value) : sum;
    }, 0);

    return {
      earned: Number(earned.toFixed(2)),
      lost: Number(lost.toFixed(2)),
      net: Number((earned - lost).toFixed(2)),
    };
  },
};
