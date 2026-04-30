import { NextRequest, NextResponse } from "next/server";

import { getCurrentUserId } from "@/lib/auth";
import { timerService } from "@/modules/timer/timer.service";

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ message: "未登录" }, { status: 401 });
    }

    const body = (await request.json()) as {
      mode?: "FINISH" | "CANCEL";
      note?: string;
      endedAt?: string;
    };

    const result =
      (body.mode ?? "FINISH") === "CANCEL"
        ? await timerService.cancelTimer(userId, body.endedAt ? new Date(body.endedAt) : undefined)
        : await timerService.stopTimer(
            userId,
            body.endedAt ? new Date(body.endedAt) : undefined,
            body.note,
          );

    return NextResponse.json({ result }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "结束计时失败" },
      { status: 400 },
    );
  }
}
