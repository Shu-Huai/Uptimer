"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUserId } from "@/lib/auth-guard";
import { toUserMessage } from "@/lib/errors";
import { rewardService } from "@/modules/reward/reward.service";

function parseStockInput(formData: FormData) {
  const raw = String(formData.get("stockInput") ?? "").trim();
  if (!raw) return undefined;
  const value = Number(raw);
  if (!Number.isFinite(value)) return undefined;
  return value;
}

export async function createRewardAction(formData: FormData) {
  const userId = await requireUserId();

  try {
    await rewardService.create({
      userId,
      name: String(formData.get("name") ?? ""),
      note: String(formData.get("note") ?? "") || undefined,
      icon: String(formData.get("icon") ?? "") || undefined,
      pricePoints: Number(formData.get("pricePoints") ?? 0),
      stockInput: parseStockInput(formData),
    });
  } catch (error) {
    redirect(`/rewards/new?error=${encodeURIComponent(toUserMessage(error))}`);
  }

  revalidatePath("/rewards");
  revalidatePath("/analysis");
  redirect("/rewards?success=reward-created");
}

export async function updateRewardAction(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");

  try {
    await rewardService.update({
      id,
      userId,
      name: String(formData.get("name") ?? ""),
      note: String(formData.get("note") ?? "") || undefined,
      icon: String(formData.get("icon") ?? "") || undefined,
      pricePoints: Number(formData.get("pricePoints") ?? 0),
      stockInput: parseStockInput(formData),
    });
  } catch (error) {
    const target = id ? `/rewards/${id}/edit` : "/rewards";
    redirect(`${target}?error=${encodeURIComponent(toUserMessage(error))}`);
  }

  revalidatePath("/rewards");
  revalidatePath(`/rewards/${id}/edit`);
  redirect("/rewards?success=reward-updated");
}

export async function redeemRewardAction(formData: FormData) {
  const userId = await requireUserId();
  const rewardItemId = String(formData.get("rewardItemId") ?? "");

  try {
    await rewardService.redeem({
      userId,
      rewardItemId,
    });
  } catch (error) {
    redirect(`/rewards?error=${encodeURIComponent(toUserMessage(error))}`);
  }

  revalidatePath("/rewards");
  revalidatePath("/analysis");
  redirect("/rewards?success=reward-redeemed");
}

export async function deleteRewardAction(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");

  try {
    await rewardService.remove({ userId, id });
  } catch (error) {
    redirect(`/rewards?error=${encodeURIComponent(toUserMessage(error))}`);
  }

  revalidatePath("/rewards");
  revalidatePath(`/rewards/${id}/edit`);
  redirect("/rewards?success=reward-deleted");
}
