import { NextRequest, NextResponse } from "next/server";
import { getId, readJson, validateStatusInput, withApiHandler } from "@/lib/api-handler";
import { requireUser, taskService } from "@/services";
import type { RouteContext } from "@/types";

const update = withApiHandler<RouteContext>("UPDATE /api/tasks/statuses/:id", async (request, context) => {
    await requireUser(request, "admin");
    const body = await readJson(request);
    validateStatusInput(body);
    const status = await taskService.updateStatus(
      getId((await context.params).id),
      { name: body.name as string },
    );
    return status
      ? NextResponse.json(status)
      : NextResponse.json({ message: "Status not found" }, { status: 404 });
});

export const PATCH = update;
export const PUT = update;

export const DELETE = withApiHandler<RouteContext>("DELETE /api/tasks/statuses/:id", async (request, context) => {
    await requireUser(request, "admin");
    const result = await taskService.deleteStatus(
      getId((await context.params).id),
    );
    if (result === "missing")
      return NextResponse.json(
        { message: "Status not found" },
        { status: 404 },
      );
    if (result === "in_use")
      return NextResponse.json(
        { message: "Move the tasks in this status before deleting it." },
        { status: 409 },
      );
    return NextResponse.json({ message: "Status deleted" });
});
