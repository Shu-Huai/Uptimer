"use client";

import { useEffect, useRef, useState } from "react";

import { IconifyIcon } from "@/components/ui/iconify-icon";

export type CustomSelectOption = {
  value: string;
  label: string;
};

type CustomSelectProps = {
  name: string;
  options: CustomSelectOption[];
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  onChange?: (value: string) => void;
};

export function CustomSelect({
  name,
  options,
  value: controlledValue,
  defaultValue = "",
  placeholder = "请选择",
  required = false,
  onChange,
}: CustomSelectProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const value = controlledValue ?? internalValue;
  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  function selectValue(nextValue: string) {
    if (controlledValue === undefined) {
      setInternalValue(nextValue);
    }
    onChange?.(nextValue);
    setOpen(false);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen((previous) => !previous);
      return;
    }

    if (!open || !options.length) return;

    const currentIndex = Math.max(0, options.findIndex((option) => option.value === value));
    if (event.key === "ArrowDown") {
      event.preventDefault();
      selectValue(options[Math.min(options.length - 1, currentIndex + 1)].value);
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      selectValue(options[Math.max(0, currentIndex - 1)].value);
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <input type="hidden" name={name} value={value} required={required} />
      <button
        type="button"
        className="up-field flex items-center justify-between gap-2 text-left"
        onClick={() => setOpen((previous) => !previous)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={selectedOption ? "truncate" : "truncate text-[#98a1b3]"}>
          {selectedOption?.label ?? placeholder}
        </span>
        <IconifyIcon
          icon="solar:alt-arrow-down-outline"
          className={`up-icon up-icon-sm shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div
          className="up-soft-panel absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-64 overflow-y-auto p-1.5"
          role="listbox"
          aria-label={name}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`block w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                  isSelected
                    ? "bg-[#e8f4ff] font-semibold text-[#2a9df4]"
                    : "text-[#5e6c85] hover:bg-[#f4f8fd]"
                }`}
                onClick={() => selectValue(option.value)}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
