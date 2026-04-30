import type { RecordSource } from "@prisma/client";

export type CreateRecordInput = {
  userId: string;
  activityId: string;
  startAt: Date;
  endAt: Date;
  note?: string;
  source: RecordSource;
};

export type CreateManualRecordInput = Omit<CreateRecordInput, "source">;

export type UpdateManualRecordInput = {
  userId: string;
  id: string;
  activityId: string;
  startAt: Date;
  endAt: Date;
  note?: string;
};

export type DeleteManualRecordInput = {
  userId: string;
  id: string;
};
