import type { StockMode } from "@prisma/client";

export type CreateRewardInput = {
  userId: string;
  name: string;
  note?: string;
  icon?: string;
  pricePoints: number;
  stockInput?: number | null;
};

export type UpdateRewardInput = CreateRewardInput & {
  id: string;
};

export type DeleteRewardInput = {
  userId: string;
  id: string;
};

export type RedeemRewardInput = {
  userId: string;
  rewardItemId: string;
};

export type ParsedStock = {
  stockMode: StockMode;
  stock: number | null;
};
