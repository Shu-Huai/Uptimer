"use client";

import { createPortal } from "react-dom";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";

import { ActivityNature } from "@prisma/client";

import {
  deleteActivityAction,
  updateActivityAction,
} from "@/actions/activity.actions";
import { IconifyIcon } from "@/components/ui/iconify-icon";
import { IconifyPicker } from "@/components/ui/iconify-picker";

type ActivityListItem = {
  id: string;
  name: string;
  note: string | null;
  icon: string | null;
  nature: ActivityNature;
  rewardRatePerHour: number;
  isEnabled: boolean;
};

type ActivityListManagerProps = {
  activities: ActivityListItem[];
};

const NATURE_LABEL: Record<ActivityNature, string> = {
  POSITIVE: "积极",
  NEUTRAL: "普通",
  NEGATIVE: "消极",
};

const NATURE_SECTIONS: Array<{ nature: ActivityNature; title: string }> = [
  { nature: ActivityNature.POSITIVE, title: "积极活动" },
  { nature: ActivityNature.NEUTRAL, title: "普通活动" },
  { nature: ActivityNature.NEGATIVE, title: "消极活动" },
];

function rateClassByNature(nature: ActivityNature) {
  if (nature === ActivityNature.POSITIVE) return "text-[#4ab06e]";
  if (nature === ActivityNature.NEGATIVE) return "text-[#f39c44]";
  return "text-[#2a9df4]";
}

function activityCardTone(nature: ActivityNature) {
  if (nature === ActivityNature.POSITIVE) return "border-[#d9efe2] bg-[#f6fcf8]";
  if (nature === ActivityNature.NEGATIVE) return "border-[#f6e3d3] bg-[#fffaf5]";
  return "border-[#e2ecfb] bg-[#f8fbff]";
}

function ActivityModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const overlayRoot = typeof document === "undefined" ? null : document.getElementById("uptimer-overlay-root");
  if (!overlayRoot) return null;

  return createPortal(
    <div
      className="up-overlay-backdrop pointer-events-auto absolute inset-0 z-[80] flex items-center justify-center p-3"
      onClick={onClose}
      role="presentation"
    >
      <section
        onClick={(event) => event.stopPropagation()}
        className="up-overlay-surface w-full max-w-[420px] max-h-[90dvh] overflow-y-auto overscroll-contain rounded-[28px] px-4 pb-4 pt-3"
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-[#394357]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="up-ghost-icon-btn"
          >
            <IconifyIcon icon="solar:close-circle-outline" className="up-icon up-icon-lg" />
          </button>
        </div>
        {children}
      </section>
    </div>,
    overlayRoot,
  );
}

export function ActivityListManager({ activities }: ActivityListManagerProps) {
  const [detailActivityId, setDetailActivityId] = useState<string | null>(null);
  const [editActivityId, setEditActivityId] = useState<string | null>(null);

  const groupedActivities = useMemo(() => {
    const byNature: Record<ActivityNature, ActivityListItem[]> = {
      POSITIVE: [],
      NEUTRAL: [],
      NEGATIVE: [],
    };
    for (const activity of activities) {
      byNature[activity.nature].push(activity);
    }
    return byNature;
  }, [activities]);

  const detailActivity = detailActivityId ? activities.find((item) => item.id === detailActivityId) : undefined;
  const editActivity = editActivityId ? activities.find((item) => item.id === editActivityId) : undefined;

  return (
    <>
      <div className="space-y-3">
        {NATURE_SECTIONS.map((section) => {
          const sectionActivities = groupedActivities[section.nature];
          if (!sectionActivities.length) return null;

          return (
            <section key={section.nature} className="space-y-2">
              <h4 className="text-sm font-semibold text-[#7f8ca1]">{section.title}</h4>
              <div className="space-y-2">
                {sectionActivities.map((activity) => (
                  <button
                    key={activity.id}
                    type="button"
                    onClick={() => setDetailActivityId(activity.id)}
                    className={`up-list-item w-full rounded-2xl border px-3 py-3 text-left text-sm transition ${activityCardTone(
                      activity.nature,
                    )}`}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-[#394357]">
                        {activity.icon ? <IconifyIcon icon={activity.icon} className="mr-1 inline-block size-4 align-[-2px]" /> : null}
                        {activity.name}
                      </h3>
                      <span className={`font-semibold ${rateClassByNature(activity.nature)}`}>
                        {activity.rewardRatePerHour >= 0 ? "+" : ""}
                        {activity.rewardRatePerHour.toFixed(2)}/h
                      </span>
                    </div>

                  </button>
                ))}
              </div>
            </section>
          );
        })}

        {!activities.length ? <p className="up-empty-state py-8 text-center text-sm">暂无活动</p> : null}
      </div>

      {detailActivity ? (
        <ActivityModalShell title="活动详情" onClose={() => setDetailActivityId(null)}>
          <div className="space-y-3 text-sm">
            <div className="up-list-item rounded-2xl border-[#e8eef8] bg-[#fbfdff] px-3 py-3">
              <p className="text-base font-semibold text-[#384358]">
                {detailActivity.icon ? <IconifyIcon icon={detailActivity.icon} className="mr-1 inline-block size-4 align-[-2px]" /> : null}
                {detailActivity.name}
              </p>
              <p className="mt-1 text-[#6f7f95]">性质：{NATURE_LABEL[detailActivity.nature]}</p>
              <p className="mt-1 text-[#6f7f95]">回报率：{detailActivity.rewardRatePerHour.toFixed(2)}/h</p>
              <p className="mt-1 text-[#6f7f95]">备注：{detailActivity.note?.trim() ? detailActivity.note : "无"}</p>
            </div>

            <div>
              <button
                type="button"
                className="up-secondary-btn w-full px-4 py-2 text-sm"
                onClick={() => {
                  setEditActivityId(detailActivity.id);
                  setDetailActivityId(null);
                }}
              >
                修改
              </button>
            </div>

            <form
              action={deleteActivityAction}
              onSubmit={(event) => {
                const ok = window.confirm("确定删除该活动吗？删除后不可恢复。");
                if (!ok) {
                  event.preventDefault();
                  return;
                }
                setDetailActivityId(null);
              }}
            >
              <input type="hidden" name="id" value={detailActivity.id} />
              <input type="hidden" name="returnTo" value="/activities" />
              <button
                type="submit"
                className="up-danger-btn w-full text-sm"
              >
                删除活动
              </button>
            </form>
          </div>
        </ActivityModalShell>
      ) : null}

      {editActivity ? (
        <ActivityModalShell title="编辑活动" onClose={() => setEditActivityId(null)}>
          <form action={updateActivityAction} className="space-y-3 text-sm">
            <input type="hidden" name="id" value={editActivity.id} />

            <label className="up-form-label">
              名称
              <input name="name" required className="up-field" defaultValue={editActivity.name} />
            </label>

            <fieldset className="grid gap-2">
              <legend className="text-[#637083]">性质</legend>
              <div className="grid grid-cols-3 gap-2">
                {(["POSITIVE", "NEUTRAL", "NEGATIVE"] as const).map((nature) => (
                  <label key={nature} className="cursor-pointer">
                    <input
                      type="radio"
                      name="nature"
                      value={nature}
                      defaultChecked={editActivity.nature === nature}
                      className="peer sr-only"
                    />
                    <span className="block rounded-full border border-[#e6ebf2] bg-[#f8fafc] px-3 py-2 text-center text-[#8591a7] transition peer-checked:border-[#d7e7f8] peer-checked:bg-[#f4f9ff] peer-checked:text-[#2a9df4]">
                      {NATURE_LABEL[nature]}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="up-form-label">
              回报率 (分/小时)
              <input
                name="rewardRatePerHour"
                required
                type="number"
                step="0.01"
                className="up-field"
                defaultValue={editActivity.rewardRatePerHour}
              />
            </label>

            <label className="up-form-label">
              图标
              <IconifyPicker name="icon" defaultValue={editActivity.icon} />
            </label>

            <label className="up-form-label">
              备注
              <textarea name="note" className="up-field min-h-20" defaultValue={editActivity.note ?? ""} />
            </label>

            <button type="submit" className="up-primary-btn w-full">
              保存活动
            </button>
          </form>
        </ActivityModalShell>
      ) : null}
    </>
  );
}
