"use client";

import { useMemo, useRef, useState } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

import { createRecordAction, updateRecordAction } from "@/actions/record.actions";
import { DateTimeWheelPicker } from "@/components/records/datetime-wheel-picker";
import { IconifyIcon } from "@/components/ui/iconify-icon";

type ActivityNature = "POSITIVE" | "NEUTRAL" | "NEGATIVE";

type ActivityOption = {
  id: string;
  name: string;
  icon: string | null;
  nature: ActivityNature;
};

type BackfillSheetFormProps = {
  activities: ActivityOption[];
  defaultStart: string;
  defaultEnd: string;
  defaultActivityId?: string;
  defaultNote?: string;
  recordId?: string;
  mode?: "create" | "edit";
  error?: string;
  closeHref?: string;
  returnDate?: string;
  onClose?: () => void;
};

const NATURE_OPTIONS: Array<{ key: ActivityNature; label: string; icon: string }> = [
  { key: "POSITIVE", label: "积极", icon: "material-symbols:mood-outline" },
  { key: "NEUTRAL", label: "普通", icon: "material-symbols:sentiment-neutral-outline" },
  { key: "NEGATIVE", label: "消极", icon: "material-symbols:mood-bad-outline" },
];
const SHEET_TRANSITION_MS = 300;
const DIALOG_TRANSITION_MS = 240;

function getFallbackIcon(nature?: ActivityNature): string {
  if (nature === "POSITIVE") return "material-symbols:favorite-outline-rounded";
  if (nature === "NEGATIVE") return "material-symbols:phone-android-outline";
  return "material-symbols:schedule-outline";
}

function parseDateInput(value: string): Date | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function formatDateInput(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d}T${hh}:${mm}`;
}

function formatDurationText(startAt: string, endAt: string): string {
  const start = parseDateInput(startAt);
  const end = parseDateInput(endAt);
  if (!start || !end || end <= start) return "0分0秒";

  const diffSec = Math.floor((end.getTime() - start.getTime()) / 1000);
  const h = Math.floor(diffSec / 3600);
  const m = Math.floor((diffSec % 3600) / 60);
  const s = diffSec % 60;

  if (h > 0) return `${h}时${m}分${s}秒`;
  return `${m}分${s}秒`;
}

export function BackfillSheetForm({
  activities,
  defaultStart,
  defaultEnd,
  defaultActivityId,
  defaultNote,
  recordId,
  mode = "create",
  error,
  closeHref = "/records",
  returnDate,
  onClose,
}: BackfillSheetFormProps) {
  const router = useRouter();
  const [startAt, setStartAt] = useState(defaultStart);
  const [endAt, setEndAt] = useState(defaultEnd);
  const [activityId, setActivityId] = useState(defaultActivityId ?? activities[0]?.id ?? "");
  const [isActivityPickerOpen, setIsActivityPickerOpen] = useState(false);
  const [isActivityPickerMounted, setIsActivityPickerMounted] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleteConfirmMounted, setIsDeleteConfirmMounted] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [shown, setShown] = useState(false);
  const isSheetClosingRef = useRef(false);
  const closeTimerRef = useRef<number | null>(null);
  const submitAction = mode === "edit" ? updateRecordAction : createRecordAction;
  const durationText = useMemo(() => formatDurationText(startAt, endAt), [startAt, endAt]);
  const currentActivity = activities.find((item) => item.id === activityId) ?? null;
  const defaultNature = currentActivity?.nature ?? activities[0]?.nature ?? "POSITIVE";
  const [activeNatureTab, setActiveNatureTab] = useState<ActivityNature>(defaultNature);
  const displayedActivities = useMemo(
    () => activities.filter((item) => item.nature === activeNatureTab),
    [activities, activeNatureTab],
  );
  const hasInnerOverlay = isActivityPickerMounted || isDeleteConfirmMounted;

  useEffect(() => {
    const timer = window.setTimeout(() => setShown(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isActivityPickerOpen || !isActivityPickerMounted) return;
    const timer = window.setTimeout(() => setIsActivityPickerMounted(false), DIALOG_TRANSITION_MS);
    return () => window.clearTimeout(timer);
  }, [isActivityPickerOpen, isActivityPickerMounted]);

  useEffect(() => {
    if (isDeleteConfirmOpen || !isDeleteConfirmMounted) return;
    const timer = window.setTimeout(() => setIsDeleteConfirmMounted(false), DIALOG_TRANSITION_MS);
    return () => window.clearTimeout(timer);
  }, [isDeleteConfirmMounted, isDeleteConfirmOpen]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  function setStartAsNow() {
    setStartAt(formatDateInput(new Date()));
  }

  function setEndAsNow() {
    setEndAt(formatDateInput(new Date()));
  }

  function setStartFromEndMinus30() {
    const end = parseDateInput(endAt) ?? new Date();
    const start = new Date(end.getTime() - 30 * 60 * 1000);
    setStartAt(formatDateInput(start));
  }

  function setEndFromStartPlus30() {
    const start = parseDateInput(startAt) ?? new Date();
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    setEndAt(formatDateInput(end));
  }

  function handleMaskClose() {
    if (isDeleteConfirmOpen) {
      closeDeleteConfirm();
      return;
    }
    if (isActivityPickerOpen) {
      closeActivityPicker();
      return;
    }
    if (onClose) {
      requestSheetClose();
      return;
    }
    requestSheetClose();
  }

  function handleOpenActivityPicker() {
    if (!activities.length) return;
    if (currentActivity?.nature) {
      setActiveNatureTab(currentActivity.nature);
    }
    setActivityError(null);
    setIsActivityPickerMounted(true);
    window.requestAnimationFrame(() => setIsActivityPickerOpen(true));
  }

  function closeActivityPicker() {
    setIsActivityPickerOpen(false);
  }

  function handlePickActivity(nextId: string) {
    setActivityId(nextId);
    setActivityError(null);
    closeActivityPicker();
  }

  function openDeleteConfirm() {
    if (mode !== "edit" || !recordId) return;
    setDeleteError(null);
    setIsDeleteConfirmMounted(true);
    window.requestAnimationFrame(() => setIsDeleteConfirmOpen(true));
  }

  function closeDeleteConfirm() {
    if (isDeleting) return;
    setIsDeleteConfirmOpen(false);
  }

  function requestSheetClose() {
    if (isSheetClosingRef.current) return;
    isSheetClosingRef.current = true;
    setShown(false);

    closeTimerRef.current = window.setTimeout(() => {
      if (onClose) {
        onClose();
        return;
      }
      router.push(closeHref);
    }, SHEET_TRANSITION_MS);
  }

  async function handleConfirmDelete() {
    if (mode !== "edit" || !recordId || isDeleting) return;

    try {
      setIsDeleting(true);
      setDeleteError(null);

      const response = await fetch(`/api/records/${recordId}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as { message?: string; delta?: number; balance?: number };
      if (!response.ok) {
        throw new Error(payload.message ?? "删除记录失败");
      }

      const query = new URLSearchParams();
      query.set("success", "record-deleted");
      if (returnDate) {
        query.set("date", returnDate);
      }
      if (typeof payload.delta === "number" && Number.isFinite(payload.delta)) {
        query.set("delta", payload.delta.toFixed(2));
      }
      if (typeof payload.balance === "number" && Number.isFinite(payload.balance)) {
        query.set("balance", payload.balance.toFixed(2));
      }

      if (onClose) {
        onClose();
      }
      router.push(`/records?${query.toString()}`);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "删除记录失败");
    } finally {
      setIsDeleting(false);
    }
  }

  if (typeof document === "undefined") return null;
  const overlayRoot = document.getElementById("uptimer-overlay-root");
  if (!overlayRoot) return null;

  const sheet = (
    <div
      className={`up-overlay-backdrop pointer-events-auto absolute inset-0 flex items-end justify-center transition-opacity duration-300 ${shown ? "opacity-100" : "opacity-0"}`}
      onClick={handleMaskClose}
      role="presentation"
    >
      <div className="flex w-full min-h-full items-end justify-center">
        <section
          onClick={(event) => event.stopPropagation()}
          className={`up-overlay-surface relative w-full max-w-[420px] max-h-[92dvh] ${hasInnerOverlay ? "overflow-hidden" : "overflow-y-auto"} overscroll-contain rounded-[30px_30px_22px_22px] border ${hasInnerOverlay ? "border-transparent" : "border-[#dbe5f2]"} px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 transition-transform duration-300 ${shown ? "translate-y-0" : "translate-y-[90%]"
            }`}
        >
          <div className="mb-2 flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-lg font-semibold text-[#4f5e76]">
              <IconifyIcon icon="solar:clock-circle-outline" className="up-icon up-icon-md text-[#4f5e76]" />
              用时:{durationText}
            </p>
            {onClose ? (
              <button type="button" onClick={requestSheetClose} className="up-ghost-icon-btn">
                <IconifyIcon icon="solar:close-circle-outline" className="up-icon up-icon-lg" />
              </button>
            ) : (
              <button type="button" onClick={requestSheetClose} className="up-ghost-icon-btn">
                <IconifyIcon icon="solar:close-circle-outline" className="up-icon up-icon-lg" />
              </button>
            )}
          </div>

          {error ? <div className="mb-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</div> : null}

          <form
            action={submitAction}
            className="space-y-3"
            onSubmit={(event) => {
              if (activityId) return;
              event.preventDefault();
              setActivityError("请选择活动后再提交");
            }}
          >
            <input type="hidden" name="from" value="backfill" />
            <input type="hidden" name="returnDate" value={returnDate ?? ""} />
            <input type="hidden" name="activityId" value={activityId} />
            {mode === "edit" ? <input type="hidden" name="recordId" value={recordId ?? ""} /> : null}

            <div className="grid grid-cols-2 gap-2">
              <DateTimeWheelPicker
                name="startAt"
                label="开始:"
                value={startAt}
                onChange={setStartAt}
                actions={
                  <div className="space-x-1">
                    <button type="button" onClick={setStartFromEndMinus30} className="up-inline-chip-sm px-2 py-0.5 text-xs">
                      上尾
                    </button>
                    <button type="button" onClick={setStartAsNow} className="up-inline-chip-sm px-2 py-0.5 text-xs">
                      当前
                    </button>
                  </div>
                }
              />

              <DateTimeWheelPicker
                name="endAt"
                label="结束:"
                value={endAt}
                onChange={setEndAt}
                actions={
                  <div className="space-x-1">
                    <button type="button" onClick={setEndAsNow} className="up-inline-chip-sm px-2 py-0.5 text-xs">
                      当前
                    </button>
                    <button type="button" onClick={setEndFromStartPlus30} className="up-inline-chip-sm px-2 py-0.5 text-xs">
                      +30分
                    </button>
                  </div>
                }
              />
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-[#7d8ba1]">活动内容</p>
              <div className="grid grid-cols-[90px_1fr] gap-2">
                <div className="rounded-2xl bg-[#eaf5ff] p-2 text-center">
                  <button
                    type="button"
                    onClick={handleOpenActivityPicker}
                    className="grid w-full gap-1 text-[#597796] disabled:cursor-not-allowed disabled:opacity-55"
                    disabled={!activities.length}
                  >
                    <span
                      className={`mx-auto inline-flex size-11 items-center justify-center rounded-full shadow-[0_10px_18px_rgba(42,157,244,0.25)] ${
                        currentActivity ? "bg-white text-[#2a9df4]" : "bg-[#2a9df4] text-white"
                      }`}
                    >
                      {currentActivity ? (
                        <IconifyIcon icon={currentActivity.icon} fallback={getFallbackIcon(currentActivity.nature)} className="size-6" />
                      ) : (
                        <IconifyIcon icon="solar:add-circle-outline" className="up-icon up-icon-lg" />
                      )}
                    </span>
                    <span className="truncate text-sm font-semibold">{currentActivity ? currentActivity.name : "选择活动"}</span>
                  </button>
                </div>
                <div className="grid gap-2">

                  {!activities.length ? (
                    <p className="text-xs text-[#98a1b3]">暂无可用活动，请先去“活动管理”创建并启用活动。</p>
                  ) : null}
                  {activityError ? <p className="text-xs text-rose-500">{activityError}</p> : null}
                  <textarea
                    name="note"
                    className="min-h-[78px] rounded-2xl border border-[#ecf1f7] bg-[#fbfdff] px-3 py-2 text-sm text-[#6c7d95] placeholder:text-[#9eafc3]"
                    placeholder={currentActivity ? `${currentActivity.name} 描述` : "描述"}
                    defaultValue={defaultNote ?? ""}
                  />
                </div>
              </div>

            </div>
            {deleteError ? <p className="text-sm text-rose-500">{deleteError}</p> : null}
            {mode === "edit" ? (
              <div className="grid grid-cols-5 gap-2">
                <button
                  type="button"
                  onClick={openDeleteConfirm}
                  disabled={!recordId || isDeleting}
                  className="col-span-1 rounded-2xl border border-rose-200 bg-rose-50 px-2 py-3 text-sm font-semibold text-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  删除
                </button>
                <button type="submit" className="up-primary-btn col-span-4 py-3 text-lg">
                  保存修改
                </button>
              </div>
            ) : (
              <button type="submit" className="up-primary-btn w-full py-3 text-lg">
                增加
              </button>
            )}
          </form>

          {isDeleteConfirmMounted ? (
            <div
              className={`up-overlay-backdrop up-dialog-transition absolute inset-0 z-[94] flex items-center justify-center rounded-[inherit] px-4 ${
                isDeleteConfirmOpen ? "up-dialog-open" : "up-dialog-closed"
              }`}
              onClick={closeDeleteConfirm}
              role="presentation"
            >
              <section
                onClick={(event) => event.stopPropagation()}
                className={`up-overlay-surface up-dialog-transition w-full max-w-[340px] rounded-3xl p-4 ${
                  isDeleteConfirmOpen ? "up-dialog-open" : "up-dialog-closed"
                }`}
              >
                <h3 className="text-base font-semibold text-[#36445b]">确认删除这条记录？</h3>
                <p className="mt-2 text-sm text-[#7b8ca3]">删除后不可恢复，并会自动回滚这条记录对应的积分。</p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={closeDeleteConfirm}
                    disabled={isDeleting}
                    className="up-secondary-btn py-2 disabled:opacity-60"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    disabled={isDeleting}
                    className="rounded-2xl bg-rose-500 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {isDeleting ? "删除中..." : "确认删除"}
                  </button>
                </div>
              </section>
            </div>
          ) : null}

          {isActivityPickerMounted ? (
            <div
              className={`up-overlay-backdrop up-dialog-transition absolute inset-0 z-[90] flex items-center justify-center rounded-[inherit] px-3 ${
                isActivityPickerOpen ? "up-dialog-open" : "up-dialog-closed"
              }`}
              onClick={closeActivityPicker}
              role="presentation"
            >
              <section
                onClick={(event) => event.stopPropagation()}
                className={`up-overlay-surface up-dialog-transition w-full max-w-[392px] max-h-[82dvh] overflow-y-auto rounded-[28px] p-4 ${
                  isActivityPickerOpen ? "up-dialog-open" : "up-dialog-closed"
                }`}
              >
                <header className="mb-3 flex items-center justify-between">
                  <h3 className="text-[21px] font-semibold text-[#384862]">选择活动</h3>
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

                {displayedActivities.length ? (
                  <div className="grid grid-cols-4 gap-x-2 gap-y-4">
                    {displayedActivities.map((item) => {
                      const isSelected = activityId === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handlePickActivity(item.id)}
                          className="text-center"
                          aria-pressed={isSelected}
                        >
                          <span
                            className={`mx-auto grid size-14 place-items-center rounded-full border text-3xl transition ${isSelected
                              ? "border-[#2a9df4] bg-[#ebf6ff] text-[#2a9df4]"
                              : "border-[#ecf1f8] bg-[#f5f8fd] text-[#6f7f99]"
                              }`}
                          >
                            <IconifyIcon icon={item.icon} fallback={getFallbackIcon(item.nature)} className="size-7" />
                          </span>
                          <span className="mt-1 block truncate text-[13px] text-[#5e6c85]">{item.name}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="up-empty-state rounded-xl border-[#dce5f3] bg-[#f8fbff] px-3 py-6 text-center text-sm">
                    该类型下暂无活动，请先在活动管理中创建
                  </p>
                )}
              </section>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );

  return createPortal(sheet, overlayRoot);
}
