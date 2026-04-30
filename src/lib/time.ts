import { addDays, format, startOfDay } from "date-fns";

export function getDayRange(baseDate: Date) {
  const start = startOfDay(baseDate);
  const end = addDays(start, 1);

  return { start, end };
}

export function parseDayParam(day: string | undefined): Date {
  if (!day) {
    return new Date();
  }

  const parsed = new Date(`${day}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }

  return parsed;
}

export function formatDateTimeInput(value: Date): string {
  return format(value, "yyyy-MM-dd'T'HH:mm");
}

export function formatDay(value: Date): string {
  return format(value, "yyyy-MM-dd");
}
