"use client";

import { useState } from "react";

import { IconifyIcon } from "@/components/ui/iconify-icon";

type CustomNumberInputProps = {
  name: string;
  defaultValue?: number | string;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
  placeholder?: string;
};

function decimalPlaces(value: number) {
  const text = String(value);
  return text.includes(".") ? text.split(".")[1].length : 0;
}

export function CustomNumberInput({
  name,
  defaultValue = "",
  min,
  max,
  step = 1,
  required = false,
  placeholder,
}: CustomNumberInputProps) {
  const [value, setValue] = useState(String(defaultValue));

  function updateByStep(direction: 1 | -1) {
    const current = Number(value);
    const base = Number.isFinite(current) ? current : direction > 0 ? min ?? 0 : max ?? min ?? 0;
    const next = base + step * direction;
    const bounded = Math.min(max ?? next, Math.max(min ?? next, next));
    setValue(bounded.toFixed(decimalPlaces(step)).replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1"));
  }

  return (
    <div className="up-number-input relative w-full">
      <input
        name={name}
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        required={required}
        placeholder={placeholder}
        inputMode={step < 1 ? "decimal" : "numeric"}
        className="up-field pr-12"
        onChange={(event) => setValue(event.target.value)}
      />
      <div className="up-number-stepper">
        <button
          type="button"
          className="up-number-step-button"
          onClick={() => updateByStep(1)}
          aria-label="增加"
        >
          <IconifyIcon icon="solar:alt-arrow-up-outline" className="up-icon size-4" />
        </button>
        <button
          type="button"
          className="up-number-step-button"
          onClick={() => updateByStep(-1)}
          aria-label="减少"
        >
          <IconifyIcon icon="solar:alt-arrow-down-outline" className="up-icon size-4" />
        </button>
      </div>
    </div>
  );
}
