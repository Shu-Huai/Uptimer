import { redirect } from "next/navigation";

import { getCurrentUserId } from "./auth";

export async function requireUserId() {
  const userId = await getCurrentUserId();
  if (!userId) {
    redirect("/auth/login");
  }

  return userId;
}
