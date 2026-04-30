import { NextRequest, NextResponse } from "next/server";

import { goalService } from "@/modules/goal/goal.service";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as { now?: string };
    const now = body.now ? new Date(body.now) : new Date();
    const result = await goalService.settleExpiredGoals(now);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "目标结算失败",
      },
      { status: 400 },
    );
  }
}
