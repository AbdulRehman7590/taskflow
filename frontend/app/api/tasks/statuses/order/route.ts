import { NextRequest, NextResponse } from "next/server";
import { readJson, withApiHandler } from "@/lib/api-handler";
import { requireUser, taskService } from "@/services";

export const PATCH = withApiHandler("PATCH /api/tasks/statuses/order", async (request) => {
    await requireUser(request, "admin");
    const body = await readJson(request);
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
      await taskService.reorderStatuses(body.statusIds),
    );
});
