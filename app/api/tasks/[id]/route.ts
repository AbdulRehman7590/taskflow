import { NextResponse } from "next/server";
import { ApiError, getId, parseJson, withApiHandler } from "@/lib/api-handler";
import { revalidateTasks } from "@/lib/cache";
import { taskStatusSchema } from "@/lib/validations";
import { requireUser, taskService } from "@/services";
import type { RouteContext } from "@/types";

export const PATCH = withApiHandler<RouteContext>(
  "PATCH /api/tasks/:id",
  async (request, context) => {
    await requireUser(request);
    const { status } = await parseJson(request, taskStatusSchema);
    const task = await taskService.update(
      getId((await context.params).id, "task id"),
      { status },
    );
    if (!task) throw new ApiError("Task not found.", 404);
    revalidateTasks();
    return NextResponse.json(task);
  },
);

export const DELETE = withApiHandler<RouteContext>(
  "DELETE /api/tasks/:id",
  async (request, context) => {
    await requireUser(request, "admin");
    const removed = await taskService.remove(
      getId((await context.params).id, "task id"),
    );
    if (!removed) throw new ApiError("Task not found.", 404);
    revalidateTasks();
    return NextResponse.json({ message: "Task deleted." });
  },
);
