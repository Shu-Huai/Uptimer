import { createActivityAction } from "@/actions/activity.actions";
import { IconifyPicker } from "@/components/ui/iconify-picker";

export function ActivityCreateForm() {
  return (
    <form action={createActivityAction} className="space-y-3">
      <label className="up-form-label">
        名称
        <input name="name" required className="up-field" placeholder="例如：学习" />
      </label>

      <fieldset className="grid gap-2">
        <legend className="text-sm text-[#637083]">性质</legend>
        <div className="grid grid-cols-3 gap-2">
          <label className="cursor-pointer">
            <input type="radio" name="nature" value="POSITIVE" defaultChecked className="peer sr-only" />
            <span className="block rounded-full border border-[#e6ebf2] bg-[#f8fafc] px-3 py-2 text-center text-sm text-[#8591a7] transition peer-checked:border-[#d7e7f8] peer-checked:bg-[#f4f9ff] peer-checked:text-[#2a9df4]">
              积极
            </span>
          </label>
          <label className="cursor-pointer">
            <input type="radio" name="nature" value="NEUTRAL" className="peer sr-only" />
            <span className="block rounded-full border border-[#e6ebf2] bg-[#f8fafc] px-3 py-2 text-center text-sm text-[#8591a7] transition peer-checked:border-[#d7e7f8] peer-checked:bg-[#f4f9ff] peer-checked:text-[#2a9df4]">
              普通
            </span>
          </label>
          <label className="cursor-pointer">
            <input type="radio" name="nature" value="NEGATIVE" className="peer sr-only" />
            <span className="block rounded-full border border-[#e6ebf2] bg-[#f8fafc] px-3 py-2 text-center text-sm text-[#8591a7] transition peer-checked:border-[#d7e7f8] peer-checked:bg-[#f4f9ff] peer-checked:text-[#2a9df4]">
              消极
            </span>
          </label>
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
          placeholder="例如：8.34"
        />
      </label>

      <label className="up-form-label">
        图标
        <IconifyPicker name="icon" defaultValue="material-symbols-light:menu-book-rounded" />
      </label>

      <label className="up-form-label">
        备注
        <textarea name="note" className="up-field min-h-20" placeholder="备注，例如：可根据需要自行修改" />
      </label>

      <button type="submit" className="up-primary-btn w-full">
        创建活动
      </button>
    </form>
  );
}
