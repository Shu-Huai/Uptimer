import { NextRequest, NextResponse } from "next/server";

import { getCurrentUserId } from "@/lib/auth";
import { parseDayParam } from "@/lib/time";
import { recordService } from "@/modules/record/record.service";

export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ message: "未登录" }, { status: 401 });
    }

    const day = request.nextUrl.searchParams.get("date") ?? undefined;
    const data = await recordService.listByDay(userId, parseDayParam(day));

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "读取记录失败",
      },
      { status: 400 },
    );
  }
}
