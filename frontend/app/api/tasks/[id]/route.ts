import { NextRequest, NextResponse } from "next/server";
import { getId, readJson, validateTaskInput, withApiHandler } from "@/lib/api-handler";
import { requireUser, taskService } from "@/services";
import type { RouteContext } from "@/types";

export const GET = withApiHandler<RouteContext>("GET /api/tasks/:id", async (request, context) => {
  await requireUser(request);
  const task = await taskService.findById(getId((await context.params).id));
  return task ? NextResponse.json(task) : NextResponse.json({ message: "Task not found" }, { status: 404 });
});

const update = withApiHandler<RouteContext>("UPDATE /api/tasks/:id", async (request, context) => {
    const user = await requireUser(request);
    const body = await readJson(request);
    if (
      user.role !== "admin" &&
      Object.keys(body).some((key) => key !== "status")
    ) {
      return NextResponse.json(
        { message: "Users can only change a task status." },
        { status: 403 },
      );
    }
    validateTaskInput(body);
    if (
      body.status &&
      !(await taskService.statusExists(body.status as string))
    ) {
      return NextResponse.json(
        { message: "Unknown task status" },
        { status: 400 },
      );
    }
    const task = await taskService.update(
      getId((await context.params).id),
      body,
    );
    return task
      ? NextResponse.json(task)
      : NextResponse.json({ message: "Task not found" }, { status: 404 });
});

export const PATCH = update;
export const PUT = update;

export const DELETE = withApiHandler<RouteContext>("DELETE /api/tasks/:id", async (request, context) => {
    await requireUser(request, "admin");
    const id = getId((await context.params).id);
    if (!(await taskService.findById(id)))
      return NextResponse.json({ message: "Task not found" }, { status: 404 });
    await taskService.remove(id);
    return NextResponse.json({ message: "Task deleted" });
});
