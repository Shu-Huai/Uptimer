"use client";

import { createPortal } from "react-dom";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IconifyIcon } from "@/components/ui/iconify-icon";

type ActivityNature = "POSITIVE" | "NEUTRAL" | "NEGATIVE";

type ActivityOption = {
  id: string;
  name: string;
  icon: string | null;
  nature: ActivityNature;
  rewardRatePerHour: number;
};

type RunningSession = {
  id: string;
  activityId: string;
  startedAt: string;
  activity: {
    id: string;
    name: string;
    icon: string | null;
    rewardRatePerHour: number | string;
  };
};

type TimerPanelProps = {
  activities: ActivityOption[];
  initialRunningSession: RunningSession | null;
};

const NATURE_OPTIONS: Array<{ key: ActivityNature; label: string; icon: string }> = [
  { key: "POSITIVE", label: "积极", icon: "material-symbols:mood-outline" },
  { key: "NEUTRAL", label: "普通", icon: "material-symbols:sentiment-neutral-outline" },
  { key: "NEGATIVE", label: "消极", icon: "material-symbols:mood-bad-outline" },
];

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) return `${h}时${m}分${s}秒`;
  if (m > 0) return `${m}分${s}秒`;
  return `${s}秒`;
}

function toSafeNumber(value: number | string | null | undefined): number {
  const n = Number(value);
  if (Number.isNaN(n) || !Number.isFinite(n)) {
    return 0;
  }
  return n;
}

function normalizeRunningSession(session: RunningSession): RunningSession {
  return {
    ...session,
    activity: {
      ...session.activity,
      rewardRatePerHour: toSafeNumber(session.activity.rewardRatePerHour),
    },
  };
}

function getNatureLabel(nature?: ActivityNature): string {
  if (nature === "POSITIVE") return "积极";
  if (nature === "NEGATIVE") return "消极";
  return "普通";
}

function getFallbackIcon(nature: ActivityNature): string {
  if (nature === "POSITIVE") return "material-symbols:favorite-outline-rounded";
  if (nature === "NEGATIVE") return "material-symbols:phone-android-outline";
  return "material-symbols:schedule-outline";
}

export function TimerPanel({ activities, initialRunningSession }: TimerPanelProps) {
  const router = useRouter();
  const defaultSelectedActivityId = initialRunningSession?.activityId ?? activities[0]?.id ?? "";
  const defaultNature =
    activities.find((item) => item.id === defaultSelectedActivityId)?.nature ?? activities[0]?.nature ?? "POSITIVE";

  const [runningSession, setRunningSession] = useState<RunningSession | null>(initialRunningSession);
  const [selectedActivityId, setSelectedActivityId] = useState(defaultSelectedActivityId);
  const [isActivityPickerOpen, setIsActivityPickerOpen] = useState(false);
  const [isActivityPickerMounted, setIsActivityPickerMounted] = useState(false);
  const [activeNatureTab, setActiveNatureTab] = useState<ActivityNature>(defaultNature);
  const [message, setMessage] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [nowTs, setNowTs] = useState(0);
  const overlayRoot = typeof document === "undefined" ? null : document.getElementById("uptimer-overlay-root");

  useEffect(() => {
    if (!runningSession) return;
    const immediate = setTimeout(() => setNowTs(Date.now()), 0);
    const timer = setInterval(() => setNowTs(Date.now()), 1000);
    return () => {
      clearTimeout(immediate);
      clearInterval(timer);
    };
  }, [runningSession]);

  useEffect(() => {
    if (isActivityPickerOpen || !isActivityPickerMounted) return;
    const timer = window.setTimeout(() => setIsActivityPickerMounted(false), 240);
    return () => window.clearTimeout(timer);
  }, [isActivityPickerOpen, isActivityPickerMounted]);

  const resolvedSelectedActivityId = useMemo(() => {
    if (activities.some((item) => item.id === selectedActivityId)) {
      return selectedActivityId;
    }
    return runningSession?.activityId ?? activities[0]?.id ?? "";
  }, [activities, runningSession?.activityId, selectedActivityId]);

  const selectedActivity = useMemo(
    () => activities.find((item) => item.id === resolvedSelectedActivityId) ?? null,
    [activities, resolvedSelectedActivityId],
  );
  const activityMapByNature = useMemo(
    () => ({
      POSITIVE: activities.filter((activity) => activity.nature === "POSITIVE"),
      NEUTRAL: activities.filter((activity) => activity.nature === "NEUTRAL"),
      NEGATIVE: activities.filter((activity) => activity.nature === "NEGATIVE"),
    }),
    [activities],
  );
  const displayedActivities = activityMapByNature[activeNatureTab];

  const activeActivity = runningSession
    ? {
        ...runningSession.activity,
        rewardRatePerHour: runningSession.activity.rewardRatePerHour,
      }
    : selectedActivity;

  const elapsedSeconds = runningSession
    ? Math.max(
        1,
        Math.floor(
          ((nowTs || new Date(runningSession.startedAt).getTime()) -
            new Date(runningSession.startedAt).getTime()) /
            1000,
        ),
      )
    : 0;

  const progress = (elapsedSeconds % 3600) / 3600;
  const pointDelta =
    activeActivity && runningSession
      ? Number(((toSafeNumber(activeActivity.rewardRatePerHour) * elapsedSeconds) / 3600).toFixed(2))
      : 0;

  async function requestApi<T>(url: string, body?: Record<string, unknown>): Promise<T> {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const payload = (await response.json()) as { message?: string } & T;
    if (!response.ok) {
      throw new Error(payload.message || "请求失败");
    }
    return payload;
  }

  function handleStart() {
    if (!resolvedSelectedActivityId) {
      setMessage("请先选择一个活动");
      return;
    }

    startTransition(async () => {
      try {
        const data = await requestApi<{ session: RunningSession }>("/api/timer/start", {
          activityId: resolvedSelectedActivityId,
        });
        const session = normalizeRunningSession(data.session);
        setRunningSession(session);
        setSelectedActivityId(session.activityId);
        setMessage("已开始计时");
        router.refresh();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "开始计时失败");
      }
    });
  }

  function handleStop(mode: "FINISH" | "CANCEL") {
    if (!runningSession) return;

    startTransition(async () => {
      try {
        await requestApi<{ result: unknown }>("/api/timer/stop", { mode });
        setRunningSession(null);
        setMessage(mode === "FINISH" ? "已结束计时并生成记录" : "已取消计时");
        router.refresh();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "结束计时失败");
      }
    });
  }

  function handleNextActivity() {
    if (!resolvedSelectedActivityId) {
      setMessage("请先选择下一个活动");
      return;
    }

    startTransition(async () => {
      try {
        let nextStartAt: string | undefined;
        if (runningSession) {
          const stopData = await requestApi<{
            result: { record: { endAt: string } };
          }>("/api/timer/stop", { mode: "FINISH" });
          const previousEndAt = new Date(stopData.result.record.endAt);
          nextStartAt = new Date(previousEndAt.getTime() + 1000).toISOString();
        }
        const data = await requestApi<{ session: RunningSession }>("/api/timer/start", {
          activityId: resolvedSelectedActivityId,
          startedAt: nextStartAt,
        });
        const session = normalizeRunningSession(data.session);
        setRunningSession(session);
        setSelectedActivityId(session.activityId);
        setMessage("已切换到下个活动");
        router.refresh();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "切换活动失败");
      }
    });
  }

  function openActivityPicker() {
    if (selectedActivity?.nature) {
      setActiveNatureTab(selectedActivity.nature);
    }
    setIsActivityPickerMounted(true);
    window.requestAnimationFrame(() => setIsActivityPickerOpen(true));
  }

  function closeActivityPicker() {
    setIsActivityPickerOpen(false);
  }

  function handleActivitySelect(activity: ActivityOption) {
    setIsActivityPickerOpen(false);

    if (!runningSession) {
      setSelectedActivityId(activity.id);
      setMessage(`已选择活动：${activity.name}`);
      return;
    }

    if (runningSession.activityId === activity.id) {
      setSelectedActivityId(activity.id);
      setMessage(`当前活动已是：${activity.name}`);
      return;
    }

    startTransition(async () => {
      try {
        const data = await requestApi<{ session: RunningSession }>("/api/timer/activity", {
          activityId: activity.id,
        });
        const session = normalizeRunningSession(data.session);
        setRunningSession(session);
        setSelectedActivityId(session.activityId);
        setMessage(`已切换活动：${session.activity.name}`);
        router.refresh();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "切换活动失败");
      }
    });
  }

  const activityPickerModal =
    isActivityPickerMounted && overlayRoot
      ? createPortal(
          <div
            className={`up-overlay-backdrop up-dialog-transition pointer-events-auto absolute inset-0 z-[80] flex items-center justify-center px-4 ${
              isActivityPickerOpen ? "up-dialog-open" : "up-dialog-closed"
            }`}
            onClick={closeActivityPicker}
          >
            <section
              className={`up-overlay-surface up-dialog-transition w-full max-w-[392px] max-h-[90dvh] overflow-y-auto overscroll-contain rounded-[28px] p-4 ${
                isActivityPickerOpen ? "up-dialog-open" : "up-dialog-closed"
              }`}
              onClick={(event) => event.stopPropagation()}
            >
              <header className="mb-3 flex items-center justify-between">
                <h3 className="text-[22px] font-semibold text-[#384862]">请选择活动</h3>
                <button
                  type="button"
                  onClick={closeActivityPicker}
                  className="up-ghost-icon-btn"
                >
                  <IconifyIcon icon="solar:close-circle-outline" className="up-icon up-icon-lg" />
                </button>
              </header>

              <nav className="up-segmented mb-4 grid grid-cols-3">
                {NATURE_OPTIONS.map((option) => {
                  const isActive = activeNatureTab === option.key;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setActiveNatureTab(option.key)}
                      className={`up-segmented-btn px-3 py-2 ${isActive ? "is-active" : ""}`}
                    >
                      <IconifyIcon icon={option.icon} className="up-icon up-icon-sm" /> {option.label}
                    </button>
                  );
                })}
              </nav>

              <div className="max-h-[340px] overflow-y-auto pr-1">
                {displayedActivities.length ? (
                  <div className="grid grid-cols-5 gap-x-2 gap-y-4">
                    {displayedActivities.map((activity) => {
                      const isActive = resolvedSelectedActivityId === activity.id;
                      return (
                        <button
                          key={activity.id}
                          type="button"
                          onClick={() => handleActivitySelect(activity)}
                          className="up-activity-option text-center"
                          aria-pressed={isActive}
                        >
                          <span
                            className={`mx-auto grid size-15 place-items-center rounded-full border text-3xl ${
                              isActive
                                ? "border-[#2a9df4] bg-[#ebf6ff] text-[#2a9df4]"
                                : "border-[#ecf1f8] bg-[#f5f8fd] text-[#6f7f99]"
                            }`}
                          >
                            <IconifyIcon icon={activity.icon} fallback={getFallbackIcon(activity.nature)} className="size-8" />
                          </span>
                          <span className="mt-1 block truncate text-[14px] text-[#5e6c85]">{activity.name}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="up-empty-state rounded-xl border-[#dce5f3] bg-[#f8fbff] px-3 py-6 text-center text-sm">
                    该类型下暂无活动，请先在活动管理中创建
                  </p>
                )}
              </div>
            </section>
          </div>,
          overlayRoot,
        )
      : null;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <header className="up-card shrink-0 flex items-center justify-center px-3 py-2">
        <h1 className="up-page-title">{activeActivity?.name ?? "计时选择"}</h1>
      </header>

      <section className="up-card flex min-h-0 flex-1 flex-col p-4">
        <div className="mb-4 flex min-h-0 flex-1 items-center justify-center">
          <div
            className="grid aspect-square h-full w-auto max-h-[240px] max-w-full place-items-center overflow-hidden rounded-full bg-[#e8edf5] p-[12%]"
            style={{
              background: `conic-gradient(#2a9df4 ${Math.round(progress * 360)}deg, var(--uptimer-ring-track) 0deg)`,
            }}
          >
            <div className="grid size-full place-items-center rounded-full">
              <div className="up-timer-ring-inner grid size-[84%] place-items-center rounded-full text-center">
              <p className="text-xl font-semibold text-[#2f384b]">{formatDuration(elapsedSeconds)}</p>
              <p className={`text-lg font-semibold ${pointDelta >= 0 ? "text-[#4ab06e]" : "text-[#f39c44]"}`}>
                {pointDelta >= 0 ? "+" : ""}
                {pointDelta.toFixed(2)}
              </p>
              </div>
            </div>
          </div>
        </div>

        <p className="shrink-0 text-center text-sm text-[#98a1b3]">
          {runningSession ? `开始于 ${new Date(runningSession.startedAt).toLocaleString()}` : "请选择活动后开始计时"}
        </p>
      </section>

      <section className="up-card shrink-0 p-4">
        <p className="mb-2 text-sm font-semibold text-[#54627a]">选择活动</p>
        <button
          type="button"
          onClick={openActivityPicker}
          className="up-activity-select up-soft-panel flex w-full items-center justify-between border-[#dfe8f4] bg-[#f4f8fd] px-3 py-3 text-left"
        >
          <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
            <span className="inline-flex min-w-0 items-center gap-2">
              <span className="grid size-10 place-items-center rounded-full bg-[#eaf3ff] text-xl text-[#2a9df4]">
                {selectedActivity ? (
                  <IconifyIcon icon={selectedActivity.icon} fallback={getFallbackIcon(selectedActivity.nature)} className="size-5" />
                ) : (
                  <IconifyIcon icon="solar:add-circle-outline" className="up-icon up-icon-md" />
                )}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-base font-semibold text-[#44526d]">
                  {selectedActivity ? selectedActivity.name : "请选择活动"}
                </span>
                <span className="block text-xs text-[#8b99b1]">
                  {selectedActivity ? `${getNatureLabel(selectedActivity.nature)}活动` : "点击打开二级菜单"}
                </span>
              </span>
            </span>
            <span className="shrink-0 text-right">
              <span className="block text-[11px] text-[#9aa8bb]">每小时积分</span>
              <span className="block text-sm font-semibold text-[#4a87c8]">
                {selectedActivity ? toSafeNumber(selectedActivity.rewardRatePerHour).toFixed(2) : "--"}
              </span>
            </span>
          </span>

        </button>
      </section>

      <div className="min-h-[20px] shrink-0">{message ? <p className="text-center text-sm text-[#5d6e89]">{message}</p> : null}</div>

      <div className="shrink-0 grid grid-cols-3 gap-3">
        <button
          type="button"
          onClick={handleNextActivity}
          disabled={isPending || !resolvedSelectedActivityId}
          className="up-secondary-btn disabled:opacity-50"
        >
          下个活动
        </button>
        {runningSession ? (
          <button
            type="button"
            onClick={() => handleStop("FINISH")}
            disabled={isPending}
            className="up-primary-btn disabled:opacity-50"
          >
            完成
          </button>
        ) : (
          <button
            type="button"
            onClick={handleStart}
            disabled={isPending || !resolvedSelectedActivityId}
            className="up-primary-btn disabled:opacity-50"
          >
            开始
          </button>
        )}
        <button
          type="button"
          onClick={() => handleStop("CANCEL")}
          disabled={isPending || !runningSession}
          className="up-secondary-btn disabled:opacity-50"
        >
          取消
        </button>
      </div>

      {activityPickerModal}
    </div>
  );
}
