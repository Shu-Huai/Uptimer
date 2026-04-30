export type StartTimerInput = {
  userId: string;
  activityId: string;
  startedAt?: Date;
};

export type StopTimerInput = {
  userId: string;
  mode: "FINISH" | "CANCEL";
  endedAt?: Date;
  note?: string;
};

export type SwitchTimerActivityInput = {
  userId: string;
  activityId: string;
};

export type TimerSessionView = {
  id: string;
  userId: string;
  activityId: string;
  startedAt: Date;
  endedAt: Date | null;
  status: "RUNNING" | "FINISHED" | "CANCELED";
  activity: {
    id: string;
    name: string;
    icon: string | null;
    rewardRatePerHour: string;
  };
};
