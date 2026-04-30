"use client";

import { useState } from "react";
import { IconifyIcon } from "@/components/ui/iconify-icon";

import { BackfillSheetForm } from "./backfill-sheet-form";

type ActivityOption = {
  id: string;
  name: string;
  icon: string | null;
  nature: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
};

type RecordsBackfillTriggerProps = {
  activities: ActivityOption[];
  defaultStart: string;
  defaultEnd: string;
  dateValue: string;
  error?: string;
  openDefault?: boolean;
};

export function RecordsBackfillTrigger({
  activities,
  defaultStart,
  defaultEnd,
  dateValue,
  error,
  openDefault = false,
}: RecordsBackfillTriggerProps) {
  const [open, setOpen] = useState(openDefault);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="up-fab inline-flex items-center justify-center text-white no-underline"
        aria-label="补记"
        title="补记"
      >
        <IconifyIcon icon="material-symbols:add" className="up-icon up-icon-xl" />
      </button>

      {open ? (
        <BackfillSheetForm
          activities={activities}
          defaultStart={defaultStart}
          defaultEnd={defaultEnd}
          error={error}
          returnDate={dateValue}
          closeHref={`/records?date=${dateValue}`}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}
