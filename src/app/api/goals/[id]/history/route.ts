import { NextRequest, NextResponse } from "next/server";

import { getCurrentUserId } from "@/lib/auth";
import { goalService } from "@/modules/goal/goal.service";

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, { params }: RouteProps) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ message: "未登录" }, { status: 401 });
    }

    const { id } = await params;
    const history = await goalService.getGoalSettlementHistory(userId, id);
    return NextResponse.json({ history }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "读取目标历史失败",
      },
      { status: 400 },
    );
  }
}
