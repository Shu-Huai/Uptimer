"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUserId } from "@/lib/auth-guard";
import { toUserMessage } from "@/lib/errors";
import { goalService } from "@/modules/goal/goal.service";

function parseTargetMinutes(formData: FormData) {
  const hours = Number(formData.get("targetHours") ?? 0);
  const minutes = Number(formData.get("targetMinutesPart") ?? 0);
  return Math.max(0, (Number.isFinite(hours) ? hours : 0) * 60 + (Number.isFinite(minutes) ? minutes : 0));
}

function parseActivityIds(formData: FormData) {
  return formData
    .getAll("activityIds")
    .map((item) => String(item))
    .filter(Boolean);
}

export async function createGoalAction(formData: FormData) {
  const userId = await requireUserId();
  let goalId = "";

  try {
    const goal = await goalService.create({
      userId,
      name: String(formData.get("name") ?? ""),
      note: String(formData.get("note") ?? "") || undefined,
      icon: String(formData.get("icon") ?? "") || undefined,
      periodType: String(formData.get("periodType") ?? "DAILY") as "DAILY" | "WEEKLY" | "MONTHLY",
      targetMinutes: parseTargetMinutes(formData),
      rewardPoints: Number(formData.get("rewardPoints") ?? 0),
      penaltyPoints: Number(formData.get("penaltyPoints") ?? 0),
      isEnabled: true,
      activityIds: parseActivityIds(formData),
    });
    goalId = goal.id;
  } catch (error) {
    redirect(`/goals/new?error=${encodeURIComponent(toUserMessage(error))}`);
  }

  revalidatePath("/goals");
  revalidatePath("/analysis");

  const query = new URLSearchParams();
  query.set("success", "goal-created");
  if (goalId) {
    const progress = await goalService.getGoalProgress(userId, goalId);
    if (progress.isCompletedPreview) {
      query.set("settleHint", "ready");
    }
  }
  redirect(`/goals?${query.toString()}`);
}

export async function updateGoalAction(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");

  try {
    await goalService.update({
      id,
      userId,
      name: String(formData.get("name") ?? ""),
      note: String(formData.get("note") ?? "") || undefined,
      icon: String(formData.get("icon") ?? "") || undefined,
      periodType: String(formData.get("periodType") ?? "DAILY") as "DAILY" | "WEEKLY" | "MONTHLY",
      targetMinutes: parseTargetMinutes(formData),
      rewardPoints: Number(formData.get("rewardPoints") ?? 0),
      penaltyPoints: Number(formData.get("penaltyPoints") ?? 0),
      isEnabled: true,
      activityIds: parseActivityIds(formData),
    });
  } catch (error) {
    const target = id ? `/goals/${id}/edit` : "/goals";
    redirect(`${target}?error=${encodeURIComponent(toUserMessage(error))}`);
  }

  revalidatePath("/goals");
  revalidatePath(`/goals/${id}/edit`);
  revalidatePath(`/goals/${id}/history`);
  revalidatePath("/analysis");

  const query = new URLSearchParams();
  query.set("success", "goal-updated");
  if (id) {
    const progress = await goalService.getGoalProgress(userId, id);
    if (progress.isCompletedPreview) {
      query.set("settleHint", "ready");
    }
  }
  redirect(`/goals?${query.toString()}`);
}

export async function toggleGoalEnabledAction(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  const enabled = String(formData.get("enabled") ?? "true") === "true";
  const returnTo = String(formData.get("returnTo") ?? "/goals");

  try {
    await goalService.toggleEnabled({ userId, id, enabled });
  } catch (error) {
    redirect(`${returnTo}?error=${encodeURIComponent(toUserMessage(error))}`);
  }

  revalidatePath("/goals");
  revalidatePath(`/goals/${id}/edit`);
  revalidatePath("/analysis");
  const success = enabled ? "goal-enabled" : "goal-deleted";
  redirect(`${returnTo}?success=${success}`);
}
