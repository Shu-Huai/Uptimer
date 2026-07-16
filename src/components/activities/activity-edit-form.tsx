import type { Activity } from "@prisma/client";

import { updateActivityAction } from "@/actions/activity.actions";
import { IconifyPicker } from "@/components/ui/iconify-picker";
import { CustomNumberInput } from "@/components/ui/custom-number-input";
import { decimalToNumber } from "@/lib/utils";

type ActivityEditFormProps = {
  activity: Activity;
};

export function ActivityEditForm({ activity }: ActivityEditFormProps) {
  return (
    <form action={updateActivityAction} className="space-y-3">
      <input type="hidden" name="id" value={activity.id} />

      <label className="up-form-label">
        名称
        <input name="name" required className="up-field" defaultValue={activity.name} />
      </label>

      <fieldset className="grid gap-2">
        <legend className="text-sm text-[#637083]">性质</legend>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <label className="cursor-pointer">
            <input
              type="radio"
              name="nature"
              value="POSITIVE"
              defaultChecked={activity.nature === "POSITIVE"}
              className="peer sr-only"
            />
            <span data-nature="positive" className="up-nature-option block rounded-full border border-[#e6ebf2] bg-[#f8fafc] px-3 py-2 text-center text-[#8591a7] transition peer-checked:border-[#d7e7f8] peer-checked:bg-[#f4f9ff] peer-checked:text-[#2a9df4]">
              积极
            </span>
          </label>
          <label className="cursor-pointer">
            <input
              type="radio"
              name="nature"
              value="NEUTRAL"
              defaultChecked={activity.nature === "NEUTRAL"}
              className="peer sr-only"
            />
            <span data-nature="neutral" className="up-nature-option block rounded-full border border-[#e6ebf2] bg-[#f8fafc] px-3 py-2 text-center text-[#8591a7] transition peer-checked:border-[#d7e7f8] peer-checked:bg-[#f4f9ff] peer-checked:text-[#2a9df4]">
              普通
            </span>
          </label>
          <label className="cursor-pointer">
            <input
              type="radio"
              name="nature"
              value="NEGATIVE"
              defaultChecked={activity.nature === "NEGATIVE"}
              className="peer sr-only"
            />
            <span data-nature="negative" className="up-nature-option block rounded-full border border-[#e6ebf2] bg-[#f8fafc] px-3 py-2 text-center text-[#8591a7] transition peer-checked:border-[#d7e7f8] peer-checked:bg-[#f4f9ff] peer-checked:text-[#2a9df4]">
              消极
            </span>
          </label>
        </div>
      </fieldset>

      <label className="up-form-label">
        回报率 (分/小时)
        <CustomNumberInput
          name="rewardRatePerHour"
          required
          step={0.01}
          defaultValue={decimalToNumber(activity.rewardRatePerHour)}
        />
      </label>

      <label className="up-form-label">
        图标
        <IconifyPicker name="icon" defaultValue={activity.icon} />
      </label>

      <label className="up-form-label">
        备注
        <textarea name="note" className="up-field min-h-20" defaultValue={activity.note ?? ""} />
      </label>

      <button type="submit" className="up-primary-btn w-full">
        保存活动
      </button>
    </form>
  );
}
