"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUserId } from "@/lib/auth-guard";
import { timerService } from "@/modules/timer/timer.service";

export async function startTimerAction(formData: FormData) {
  const userId = await requireUserId();
  const activityId = String(formData.get("activityId") ?? "");
  await timerService.start({ userId, activityId });
  revalidatePath("/timer");
  redirect("/timer");
}

export async function stopTimerAction(formData: FormData) {
  const userId = await requireUserId();
  const mode = String(formData.get("mode") ?? "FINISH") as "FINISH" | "CANCEL";
  await timerService.stop({ userId, mode });
  revalidatePath("/timer");
  revalidatePath("/records");
  revalidatePath("/points");
  redirect("/timer");
}
