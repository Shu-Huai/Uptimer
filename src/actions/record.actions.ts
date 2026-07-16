"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUserId } from "@/lib/auth-guard";
import { toUserMessage } from "@/lib/errors";
import { decimalToNumber } from "@/lib/utils";
import { pointsService } from "@/modules/points/points.service";
import { recordService } from "@/modules/record/record.service";

export async function createRecordAction(formData: FormData) {
  const userId = await requireUserId();
  const returnDate = String(formData.get("returnDate") ?? "");

  let delta = "0.00";
  let balance = "0.00";

  try {
    const record = await recordService.createManual({
      userId,
      activityId: String(formData.get("activityId") ?? ""),
      startAt: new Date(String(formData.get("startAt") ?? "")),
      endAt: new Date(String(formData.get("endAt") ?? "")),
      note: String(formData.get("note") ?? "").trim() || null,
    });
    const nextBalance = await pointsService.getBalance(userId);

    delta = decimalToNumber(record.pointDelta).toFixed(2);
    balance = decimalToNumber(nextBalance).toFixed(2);
  } catch (error) {
    const from = String(formData.get("from") ?? "records");
    if (from === "backfill") {
      const datePart = returnDate ? `&date=${encodeURIComponent(returnDate)}` : "";
      redirect(`/records?backfill=1${datePart}&error=${encodeURIComponent(toUserMessage(error))}`);
    }
    redirect(`/records?error=${encodeURIComponent(toUserMessage(error))}`);
  }

  revalidatePath("/records");
  revalidatePath("/dashboard");
  revalidatePath("/points");
  revalidatePath("/records/new");

  const query = new URLSearchParams();
  query.set("success", "record-created");
  if (returnDate) {
    query.set("date", returnDate);
  }
  query.set("delta", delta);
  query.set("balance", balance);
  redirect(`/records?${query.toString()}`);
}

export async function updateRecordAction(formData: FormData) {
  const userId = await requireUserId();
  const returnDate = String(formData.get("returnDate") ?? "");

  let delta = "0.00";
  let balance = "0.00";

  try {
    const record = await recordService.updateManual({
      userId,
      id: String(formData.get("recordId") ?? ""),
      activityId: String(formData.get("activityId") ?? ""),
      startAt: new Date(String(formData.get("startAt") ?? "")),
      endAt: new Date(String(formData.get("endAt") ?? "")),
      note: String(formData.get("note") ?? "").trim() || null,
    });
    const nextBalance = await pointsService.getBalance(userId);
    delta = decimalToNumber(record.pointDelta).toFixed(2);
    balance = decimalToNumber(nextBalance).toFixed(2);
  } catch (error) {
    const datePart = returnDate ? `&date=${encodeURIComponent(returnDate)}` : "";
    redirect(`/records?${`error=${encodeURIComponent(toUserMessage(error))}`}${datePart}`);
  }

  revalidatePath("/records");
  revalidatePath("/dashboard");
  revalidatePath("/points");

  const query = new URLSearchParams();
  query.set("success", "record-updated");
  if (returnDate) {
    query.set("date", returnDate);
  }
  query.set("delta", delta);
  query.set("balance", balance);
  redirect(`/records?${query.toString()}`);
}
