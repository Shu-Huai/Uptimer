"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IconifyIcon } from "@/components/ui/iconify-icon";
import { CustomSelect } from "@/components/ui/custom-select";

type ActivityOption = {
  id: string;
  name: string;
  icon: string | null;
};

type RunningTimerSession = {
  id: string;
  activityId: string;
  startedAt: string;
  activity: {
    id: string;
    name: string;
    icon: string | null;
  };
};

type DashboardTimerActionsProps = {
  activities: ActivityOption[];
  runningSession: RunningTimerSession | null;
  backfillHref: string;
};

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}时${m}分${s}秒`;
  if (m > 0) return `${m}分${s}秒`;
  return `${s}秒`;
}

export function DashboardTimerActions({
  activities,
  runningSession,
  backfillHref,
}: DashboardTimerActionsProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [selectedActivityId, setSelectedActivityId] = useState(
    runningSession?.activityId ?? activities[0]?.id ?? "",
  );
  const [nowTs, setNowTs] = useState(0);

  useEffect(() => {
    if (!runningSession) return;
    const timer = window.setInterval(() => setNowTs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [runningSession]);

  const selectedActivity = useMemo(
    () => activities.find((item) => item.id === selectedActivityId) ?? null,
    [activities, selectedActivityId],
  );

  const elapsedSeconds = runningSession
    ? Math.max(
        1,
        Math.floor((nowTs - new Date(runningSession.startedAt).getTime()) / 1000),
      )
    : 0;

  async function callApi(url: string, body?: Record<string, unknown>) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const payload = (await response.json()) as { message?: string };
    if (!response.ok) {
      throw new Error(payload.message || "请求失败");
    }
  }

  function handleStart() {
    if (!selectedActivityId) {
      setMessage("请先选择活动");
      return;
    }

    startTransition(async () => {
      try {
        await callApi("/api/timer/start", { activityId: selectedActivityId });
        setMessage("计时已开始");
        router.refresh();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "开始失败");
      }
    });
  }

  function handleStop(mode: "FINISH" | "CANCEL") {
    startTransition(async () => {
      try {
        await callApi("/api/timer/stop", { mode });
        setMessage(mode === "FINISH" ? "计时已停止并生成记录" : "计时已取消");
        router.refresh();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "停止失败");
      }
    });
  }

  return (
    <div className="up-card p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[#4b5a74]">实时计时</p>
        <Link href="/timer" className="text-xs up-link-muted">
          进入计时页
        </Link>
      </div>

      {runningSession ? (
        <div className="up-soft-panel mt-2 px-3 py-2">
          <p className="text-sm text-[#4c5a73]">
            进行中：
            {runningSession.activity.icon ? <IconifyIcon icon={runningSession.activity.icon} className="mx-1 inline-block size-4 align-[-2px]" /> : null}
            {runningSession.activity.name}
          </p>
          <p className="mt-1 text-lg font-semibold text-[#2a9df4]">{formatElapsed(elapsedSeconds)}</p>
        </div>
      ) : (
        <div className="mt-2 grid gap-2">
          <CustomSelect
            name="dashboardActivity"
            options={activities.map((item) => ({ value: item.id, label: item.name }))}
            value={selectedActivityId}
            onChange={setSelectedActivityId}
            placeholder="请选择活动"
          />
          <p className="text-xs text-[#97a5bb]">
            {selectedActivity ? `将开始活动：${selectedActivity.name}` : "请选择一个已启用活动"}
          </p>
        </div>
      )}

      <div className="mt-3 grid grid-cols-3 gap-2">
        <button
          type="button"
          className="up-secondary-btn py-2 text-sm disabled:opacity-50"
          onClick={handleStart}
          disabled={isPending || !!runningSession || !selectedActivityId}
        >
          快速开始
        </button>
        <button
          type="button"
          className="up-primary-btn py-2 text-sm disabled:opacity-50"
          onClick={() => handleStop("FINISH")}
          disabled={isPending || !runningSession}
        >
          快速停止
        </button>
        <button
          type="button"
          className="up-secondary-btn py-2 text-sm disabled:opacity-50"
          onClick={() => handleStop("CANCEL")}
          disabled={isPending || !runningSession}
        >
          取消计时
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <Link href={backfillHref} className="text-xs up-link-muted">
          去补录记录
        </Link>
        {message ? <p className="text-xs text-[#687990]">{message}</p> : null}
      </div>
    </div>
  );
}
