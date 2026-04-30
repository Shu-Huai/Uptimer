"use client";

import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";

import { IconifyIcon } from "@/components/ui/iconify-icon";
import { DELETED_ACTIVITY_NAME } from "@/lib/constants";

type ActivityNature = "POSITIVE" | "NEUTRAL" | "NEGATIVE";

type GoalActivityOption = {
  id: string;
  name: string;
  icon: string | null;
  nature: ActivityNature;
  isEnabled: boolean;
  isDeleted?: boolean;
};

type GoalActivityPickerProps = {
  activities: GoalActivityOption[];
  defaultSelectedIds: string[];
};

const NATURE_OPTIONS: Array<{ key: ActivityNature; label: string; icon: string }> = [
  { key: "POSITIVE", label: "积极", icon: "material-symbols:mood-outline" },
  { key: "NEUTRAL", label: "普通", icon: "material-symbols:sentiment-neutral-outline" },
  { key: "NEGATIVE", label: "消极", icon: "material-symbols:mood-bad-outline" },
];

function getFallbackIcon(nature: ActivityNature): string {
  if (nature === "POSITIVE") return "material-symbols:favorite-outline-rounded";
  if (nature === "NEGATIVE") return "material-symbols:phone-android-outline";
  return "material-symbols:schedule-outline";
}

function labelForActivity(activity: GoalActivityOption): string {
  if (activity.isDeleted) return DELETED_ACTIVITY_NAME;
  return activity.name;
}

export function GoalActivityPicker({ activities, defaultSelectedIds }: GoalActivityPickerProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([...new Set(defaultSelectedIds)]);
  const [activeNatureTab, setActiveNatureTab] = useState<ActivityNature>(() => {
    const first = activities.find((item) => !item.isDeleted) ?? activities[0];
    return first?.nature ?? "POSITIVE";
  });
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isPickerMounted, setIsPickerMounted] = useState(false);
  const overlayRoot = typeof document === "undefined" ? null : document.getElementById("uptimer-overlay-root");

  useEffect(() => {
    if (isPickerOpen || !isPickerMounted) return;
    const timer = window.setTimeout(() => setIsPickerMounted(false), 240);
    return () => window.clearTimeout(timer);
  }, [isPickerOpen, isPickerMounted]);

  const activityIdSet = useMemo(() => new Set(activities.map((item) => item.id)), [activities]);
  const resolvedSelectedIds = useMemo(
    () => selectedIds.filter((id) => activityIdSet.has(id)),
    [selectedIds, activityIdSet],
  );
  const selectedSet = useMemo(() => new Set(resolvedSelectedIds), [resolvedSelectedIds]);
  const selectedActivities = useMemo(
    () => activities.filter((item) => selectedSet.has(item.id)),
    [activities, selectedSet],
  );
  const displayedActivities = useMemo(
    () => activities.filter((item) => item.nature === activeNatureTab && !item.isDeleted),
    [activities, activeNatureTab],
  );
  const deletedSelectedActivities = useMemo(
    () => activities.filter((item) => item.isDeleted && selectedSet.has(item.id)),
    [activities, selectedSet],
  );

  function toggleActivity(id: string) {
    if (!activityIdSet.has(id)) return;
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  }

  function openPicker() {
    if (!activities.length) return;
    const selected = activities.find((item) => selectedSet.has(item.id) && !item.isDeleted);
    if (selected) {
      setActiveNatureTab(selected.nature);
    }
    setIsPickerMounted(true);
    window.requestAnimationFrame(() => setIsPickerOpen(true));
  }

  function closePicker() {
    setIsPickerOpen(false);
  }

  const pickerModal =
    isPickerMounted && overlayRoot
      ? createPortal(
          <div
            className={`up-overlay-backdrop up-dialog-transition pointer-events-auto absolute inset-0 z-[80] flex items-center justify-center px-4 ${
              isPickerOpen ? "up-dialog-open" : "up-dialog-closed"
            }`}
            onClick={closePicker}
            role="presentation"
          >
            <section
              className={`up-overlay-surface up-dialog-transition w-full max-w-[392px] max-h-[90dvh] overflow-y-auto overscroll-contain rounded-[28px] p-4 ${
                isPickerOpen ? "up-dialog-open" : "up-dialog-closed"
              }`}
              onClick={(event) => event.stopPropagation()}
            >
              <header className="mb-3 flex items-center justify-between">
                <h3 className="text-[22px] font-semibold text-[#384862]">关联活动（多选）</h3>
                <button type="button" onClick={closePicker} className="up-ghost-icon-btn">
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
                  <div className="grid grid-cols-4 gap-x-2 gap-y-4">
                    {displayedActivities.map((activity) => {
                      const isActive = selectedSet.has(activity.id);
                      return (
                        <button
                          key={activity.id}
                          type="button"
                          onClick={() => toggleActivity(activity.id)}
                          className="text-center"
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
                          <span className="mt-1 block truncate text-[13px] text-[#5e6c85]">{labelForActivity(activity)}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="up-empty-state rounded-xl border-[#dce5f3] bg-[#f8fbff] px-3 py-6 text-center text-sm">
                    该类型下暂无可用活动
                  </p>
                )}

                {deletedSelectedActivities.length ? (
                  <div className="mt-4 rounded-xl border border-[#f5e6d6] bg-[#fff9f3] p-3">
                    <p className="mb-2 text-xs font-semibold text-[#d58f3a]">已删除活动（仅已关联项）</p>
                    <div className="grid grid-cols-2 gap-2">
                      {deletedSelectedActivities.map((activity) => (
                        <button
                          key={activity.id}
                          type="button"
                          onClick={() => toggleActivity(activity.id)}
                          className="up-inline-chip justify-between border-[#f1dbc1] bg-[#fff3e4] text-xs text-[#9a7547]"
                        >
                          <span className="truncate">{DELETED_ACTIVITY_NAME}</span>
                          <IconifyIcon icon="solar:check-circle-bold" className="up-icon up-icon-sm text-[#d58f3a]" />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <button type="button" onClick={closePicker} className="up-primary-btn mt-4 w-full py-2.5">
                完成选择（已选 {resolvedSelectedIds.length}）
              </button>
            </section>
          </div>,
          overlayRoot,
        )
      : null;

  return (
    <div className="space-y-2">
      {resolvedSelectedIds.map((id) => (
        <input key={id} type="hidden" name="activityIds" value={id} />
      ))}
      <input
        value={resolvedSelectedIds.length ? "ok" : ""}
        readOnly
        required
        className="sr-only absolute h-0 w-0 opacity-0"
        aria-hidden
        tabIndex={-1}
      />

      <button
        type="button"
        onClick={openPicker}
        className="up-soft-panel flex w-full items-center justify-between border-[#dfe8f4] bg-[#f4f8fd] px-3 py-3 text-left"
      >
        <span className="block min-w-0">
          <span className="block truncate text-base font-semibold text-[#44526d]">
            {selectedActivities.length ? `已选 ${selectedActivities.length} 项活动` : "请选择活动"}
          </span>
          <span className="block text-xs text-[#8b99b1]">点击打开多选活动弹窗</span>
        </span>
        <IconifyIcon icon="solar:alt-arrow-right-outline" className="up-icon up-icon-md text-[#8ea0bb]" />
      </button>

      {selectedActivities.length ? (
        <div className="flex flex-wrap gap-2">
          {selectedActivities.map((activity) => (
            <span key={activity.id} className="up-inline-chip px-3 py-1 text-xs text-[#5e7393]">
              {labelForActivity(activity)}
            </span>
          ))}
        </div>
      ) : null}

      {pickerModal}
    </div>
  );
}
