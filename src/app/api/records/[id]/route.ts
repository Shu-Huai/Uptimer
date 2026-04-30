import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { getCurrentUserId } from "@/lib/auth";
import { decimalToNumber } from "@/lib/utils";
import { pointsService } from "@/modules/points/points.service";
import { recordService } from "@/modules/record/record.service";

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: NextRequest, { params }: RouteProps) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ message: "未登录" }, { status: 401 });
    }

    const { id } = await params;
    const result = await recordService.deleteManual({ userId, id });
    const balance = await pointsService.getBalance(userId);

    revalidatePath("/records");
    revalidatePath("/dashboard");
    revalidatePath("/points");

    return NextResponse.json(
      {
        id: result.id,
        delta: result.rollbackAmount,
        balance: decimalToNumber(balance),
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "删除记录失败",
      },
      { status: 400 },
    );
  }
}
