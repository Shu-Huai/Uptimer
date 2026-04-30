"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUserId } from "@/lib/auth-guard";
import { toUserMessage } from "@/lib/errors";
import { activityService } from "@/modules/activity/activity.service";

export async function createActivityAction(formData: FormData) {
  const userId = await requireUserId();

  try {
    await activityService.create({
      userId,
      name: String(formData.get("name") ?? ""),
      note: String(formData.get("note") ?? "") || undefined,
      icon: String(formData.get("icon") ?? "") || undefined,
      nature: String(formData.get("nature") ?? "") as "POSITIVE" | "NEUTRAL" | "NEGATIVE",
      rewardRatePerHour: Number(formData.get("rewardRatePerHour") ?? 0),
    });
  } catch (error) {
    redirect(`/activities?error=${encodeURIComponent(toUserMessage(error))}`);
  }

  revalidatePath("/activities");
  revalidatePath("/dashboard");
  redirect("/activities?success=activity-created");
}

export async function updateActivityAction(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");

  try {
    await activityService.update({
      id,
      userId,
      name: String(formData.get("name") ?? ""),
      note: String(formData.get("note") ?? "") || undefined,
      icon: String(formData.get("icon") ?? "") || undefined,
      nature: String(formData.get("nature") ?? "") as "POSITIVE" | "NEUTRAL" | "NEGATIVE",
      rewardRatePerHour: Number(formData.get("rewardRatePerHour") ?? 0),
    });
  } catch (error) {
    const target = id ? `/activities/${id}/edit` : "/activities";
    redirect(`${target}?error=${encodeURIComponent(toUserMessage(error))}`);
  }

  revalidatePath("/activities");
  revalidatePath(`/activities/${id}/edit`);
  revalidatePath("/dashboard");
  redirect("/activities?success=activity-updated");
}

export async function setActivityEnabledAction(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  const enabled = String(formData.get("enabled") ?? "true") === "true";
  const returnTo = String(formData.get("returnTo") ?? "/activities");

  try {
    await activityService.setEnabled({
      userId,
      id,
      enabled,
    });
  } catch (error) {
    redirect(`${returnTo}?error=${encodeURIComponent(toUserMessage(error))}`);
  }

  revalidatePath("/activities");
  revalidatePath("/dashboard");
  revalidatePath("/records");
  revalidatePath("/timer");

  const success = enabled ? "activity-enabled" : "activity-disabled";
  redirect(`${returnTo}?success=${success}`);
}

export async function deleteActivityAction(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  const returnTo = String(formData.get("returnTo") ?? "/activities");

  try {
    await activityService.delete({
      userId,
      id,
    });
  } catch (error) {
    redirect(`${returnTo}?error=${encodeURIComponent(toUserMessage(error))}`);
  }

  revalidatePath("/activities");
  revalidatePath("/dashboard");
  revalidatePath("/records");
  revalidatePath("/timer");
  redirect(`${returnTo}?success=activity-deleted`);
}
