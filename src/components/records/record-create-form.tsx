import type { Activity } from "@prisma/client";

import { createRecordAction } from "@/actions/record.actions";

type RecordCreateFormProps = {
  activities: Activity[];
  initialStart: string;
  initialEnd: string;
};

export function RecordCreateForm({ activities, initialStart, initialEnd }: RecordCreateFormProps) {
  return (
    <form action={createRecordAction} className="space-y-3">
      <label className="grid gap-1 text-sm text-[#637083]">
        活动
        <select name="activityId" required className="up-field">
          <option value="">请选择活动</option>
          {activities.map((activity) => (
            <option key={activity.id} value={activity.id}>
              {activity.name}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-1 text-sm text-[#637083]">
          开始时间
          <input
            name="startAt"
            type="datetime-local"
            required
            defaultValue={initialStart}
            className="up-date-field"
          />
        </label>

        <label className="grid gap-1 text-sm text-[#637083]">
          结束时间
          <input
            name="endAt"
            type="datetime-local"
            required
            defaultValue={initialEnd}
            className="up-date-field"
          />
        </label>
      </div>

      <label className="grid gap-1 text-sm text-[#637083]">
        备注
        <textarea name="note" className="up-field min-h-20" placeholder="可选" />
      </label>

      <button type="submit" className="up-primary-btn w-full">
        补录并结算积分
      </button>
    </form>
  );
}
