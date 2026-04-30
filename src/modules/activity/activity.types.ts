import type { ActivityNature } from "@prisma/client";

export type CreateActivityInput = {
  userId: string;
  name: string;
  note?: string;
  icon?: string;
  nature: ActivityNature;
  rewardRatePerHour: number;
};

export type UpdateActivityInput = Omit<CreateActivityInput, "userId"> & {
  userId: string;
  id: string;
};

export type SetActivityEnabledInput = {
  userId: string;
  id: string;
  enabled: boolean;
};

export type DeleteActivityInput = {
  userId: string;
  id: string;
};
