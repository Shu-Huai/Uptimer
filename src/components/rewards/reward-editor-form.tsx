import { IconifyPicker } from "@/components/ui/iconify-picker";
import { CustomNumberInput } from "@/components/ui/custom-number-input";

type RewardEditorFormProps = {
  action: (formData: FormData) => Promise<void>;
  submitText: string;
  reward?: {
    id: string;
    name: string;
    note?: string | null;
    icon?: string | null;
    pricePoints: number;
    stock: number | null;
  };
};

export function RewardEditorForm({ action, submitText, reward }: RewardEditorFormProps) {
  return (
    <form action={action} className="space-y-3">
      {reward ? <input type="hidden" name="id" value={reward.id} /> : null}

      <label className="up-form-label">
        名称
        <input name="name" required className="up-field" defaultValue={reward?.name ?? ""} placeholder="例如：一日旅行" />
      </label>

      <label className="up-form-label">
        所需积分
        <CustomNumberInput
          name="pricePoints"
          required
          min={0.01}
          step={0.01}
          defaultValue={reward?.pricePoints ?? ""}
          placeholder="例如：500"
        />
      </label>

      <label className="up-form-label">
        库存
        <CustomNumberInput
          name="stockInput"
          min={0}
          step={1}
          defaultValue={reward?.stock ?? ""}
          placeholder="留空表示不限库存"
        />
      </label>

      <label className="up-form-label">
        图标
        <IconifyPicker name="icon" defaultValue={reward?.icon ?? "solar:medal-ribbons-star-outline"} />
      </label>

      <label className="up-form-label">
        备注
        <textarea
          name="note"
          className="up-field min-h-20"
          defaultValue={reward?.note ?? ""}
          placeholder="例如：完成阶段目标后兑换"
        />
      </label>

      <button type="submit" className="up-primary-btn w-full">
        {submitText}
      </button>
    </form>
  );
}
