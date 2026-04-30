import { NextResponse } from "next/server";

import { getCurrentUserId } from "@/lib/auth";
import { timerService } from "@/modules/timer/timer.service";

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ message: "未登录" }, { status: 401 });
    }

    const session = await timerService.getRunningTimer(userId);
    return NextResponse.json({ session }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "获取计时状态失败" },
      { status: 400 },
    );
  }
}
