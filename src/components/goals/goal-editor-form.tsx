import { GoalPeriodType } from "@prisma/client";
import { IconifyPicker } from "@/components/ui/iconify-picker";
import { GoalActivityPicker } from "@/components/goals/goal-activity-picker";

type GoalEditorFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  submitText: string;
  activities: Array<{
    id: string;
    name: string;
    icon: string | null;
    nature: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
    isEnabled: boolean;
    isDeleted?: boolean;
  }>;
  goal?: {
    id: string;
    name: string;
    note: string | null;
    icon: string | null;
    periodType: GoalPeriodType;
    targetMinutes: number;
    rewardPoints: number;
    penaltyPoints: number;
    isEnabled: boolean;
    activityIds: string[];
  };
};

export function GoalEditorForm({ action, submitText, activities, goal }: GoalEditorFormProps) {
  const targetHours = Math.floor((goal?.targetMinutes ?? 60) / 60);
  const targetMinutesPart = (goal?.targetMinutes ?? 60) % 60;
  const selectedIds = new Set(goal?.activityIds ?? []);

  return (
    <form action={action} className="space-y-3">
      {goal ? <input type="hidden" name="id" value={goal.id} /> : null}

      <label className="up-form-label">
        目标名称
        <input name="name" required className="up-field" defaultValue={goal?.name ?? ""} placeholder="例如：每日学习" />
      </label>

      <label className="up-form-label">
        备注
        <textarea name="note" className="up-field min-h-20" defaultValue={goal?.note ?? ""} />
      </label>

      <label className="up-form-label">
        图标
        <IconifyPicker name="icon" defaultValue={goal?.icon} />
      </label>

      <label className="up-form-label">
        周期
        <select name="periodType" className="up-field" defaultValue={goal?.periodType ?? "DAILY"}>
          <option value="DAILY">每日</option>
          <option value="WEEKLY">每周</option>
          <option value="MONTHLY">每月</option>
        </select>
      </label>

      <fieldset className="grid gap-2">
        <legend className="text-sm text-[#637083]">目标时长</legend>
        <div className="grid grid-cols-2 gap-2">
          <label className="up-form-label text-[#7f8ea5]">
            小时
            <input name="targetHours" type="number" min={0} className="up-field" defaultValue={targetHours} />
          </label>
          <label className="up-form-label text-[#7f8ea5]">
            分钟
            <input
              name="targetMinutesPart"
              type="number"
              min={0}
              max={59}
              className="up-field"
              defaultValue={targetMinutesPart}
            />
          </label>
        </div>
      </fieldset>

      <fieldset className="grid gap-2">
        <legend className="text-sm text-[#637083]">关联活动（至少选择 1 项）</legend>
        <GoalActivityPicker activities={activities} defaultSelectedIds={[...selectedIds]} />
      </fieldset>

      <div className="grid grid-cols-2 gap-2">
        <label className="up-form-label">
          完成奖励积分
          <input
            name="rewardPoints"
            type="number"
            min={0}
            step="0.01"
            className="up-field"
            defaultValue={goal?.rewardPoints ?? 0}
          />
        </label>
        <label className="up-form-label">
          失败扣减积分
          <input
            name="penaltyPoints"
            type="number"
            min={0}
            step="0.01"
            className="up-field"
            defaultValue={goal?.penaltyPoints ?? 0}
          />
        </label>
      </div>

      <button type="submit" className="up-primary-btn w-full">
        {submitText}
      </button>
    </form>
  );
}
