import { requireUserId } from "@/lib/auth-guard";
import { decimalToNumber } from "@/lib/utils";
import { activityService } from "@/modules/activity/activity.service";
import { timerService } from "@/modules/timer/timer.service";
import { TimerPanel } from "@/components/timer/timer-panel";

async function loadTimerPageData(userId: string) {
  const [activities, running] = await Promise.all([
    activityService.listEnabled(userId),
    timerService.getRunningSession(userId),
  ]);

  return {
    activities: activities.map((item) => ({
      id: item.id,
      name: item.name,
      icon: item.icon,
      nature: item.nature,
      rewardRatePerHour: decimalToNumber(item.rewardRatePerHour),
    })),
    running: running
      ? {
          id: running.id,
          activityId: running.activityId,
          startedAt: running.startedAt.toISOString(),
          activity: {
            id: running.activity.id,
            name: running.activity.name,
            icon: running.activity.icon,
            rewardRatePerHour: decimalToNumber(running.activity.rewardRatePerHour),
          },
        }
      : null,
  };
}

export default async function TimerPage() {
  const userId = await requireUserId();
  const data = await loadTimerPageData(userId);

  return <TimerPanel activities={data.activities} initialRunningSession={data.running} />;
}
