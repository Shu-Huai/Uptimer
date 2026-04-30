"use server";

import { redirect } from "next/navigation";

import { clearSession, setSession } from "@/lib/auth";
import { toUserMessage } from "@/lib/errors";
import { authService } from "@/modules/auth/auth.service";

export async function loginAction(formData: FormData) {
  try {
    const user = await authService.login({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    });

    await setSession(user.id, user.email ?? "");
  } catch (error) {
    redirect(`/auth/login?error=${encodeURIComponent(toUserMessage(error))}`);
  }

  redirect("/records");
}

export async function registerAction(formData: FormData) {
  try {
    const user = await authService.register({
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    });

    await setSession(user.id, user.email ?? "");
  } catch (error) {
    redirect(`/auth/register?error=${encodeURIComponent(toUserMessage(error))}`);
  }

  redirect("/records");
}

export async function logoutAction() {
  await clearSession();
  redirect("/auth/login");
}
