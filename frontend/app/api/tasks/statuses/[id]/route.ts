import { NextResponse } from "next/server";
import { ApiError, getId, parseJson, withApiHandler } from "@/lib/api-handler";
import { revalidateStatuses } from "@/lib/cache";
import { statusSchema } from "@/lib/validations";
import { requireUser, taskService } from "@/services";
import type { RouteContext } from "@/types";

export const PATCH = withApiHandler<RouteContext>(
  "PATCH /api/tasks/statuses/:id",
  async (request, context) => {
    await requireUser(request, "admin");
    const status = await taskService.updateStatus(
      getId((await context.params).id, "status id"),
      await parseJson(request, statusSchema),
    );
    if (!status) throw new ApiError("Status not found.", 404);
    revalidateStatuses();
    return NextResponse.json(status);
  },
);

export const DELETE = withApiHandler<RouteContext>(
  "DELETE /api/tasks/statuses/:id",
  async (request, context) => {
    await requireUser(request, "admin");
    const result = await taskService.deleteStatus(
      getId((await context.params).id, "status id"),
    );
    if (result === "missing") throw new ApiError("Status not found.", 404);
    if (result === "in_use")
      throw new ApiError(
        "Move the tasks in this status before deleting it.",
        409,
      );
    revalidateStatuses();
    return NextResponse.json({ message: "Status deleted." });
  },
);
