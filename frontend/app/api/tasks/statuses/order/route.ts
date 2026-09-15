import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/api-handler";
import { taskService } from "@/lib/task-service";

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as { statusIds?: unknown };
    if (
      !Array.isArray(body.statusIds) ||
      body.statusIds.some((id) => !Number.isInteger(id))
    ) {
      return NextResponse.json(
        { message: "statusIds must be an array of integers" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      await taskService.reorderStatuses(body.statusIds as number[]),
    );
  } catch (error) {
    return errorResponse(error, "PATCH /api/tasks/statuses/order");
  }
}
