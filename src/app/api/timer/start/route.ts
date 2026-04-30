import { NextRequest, NextResponse } from "next/server";

import { getCurrentUserId } from "@/lib/auth";
import { timerService } from "@/modules/timer/timer.service";

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ message: "未登录" }, { status: 401 });
    }

    const body = (await request.json()) as { activityId?: string; startedAt?: string };
    const session = await timerService.startTimer(
      userId,
      body.activityId ?? "",
      body.startedAt ? new Date(body.startedAt) : undefined,
    );

    return NextResponse.json({ session }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "开始计时失败" },
      { status: 400 },
    );
  }
}
