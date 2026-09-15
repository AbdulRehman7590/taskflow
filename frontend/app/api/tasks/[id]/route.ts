import { NextRequest, NextResponse } from "next/server";
import { errorResponse, getId, validateTaskInput } from "@/lib/api-handler";
import { taskService } from "@/lib/task-service";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: Context) {
  try {
    const task = await taskService.findById(getId((await context.params).id));
    return task
      ? NextResponse.json(task)
      : NextResponse.json({ message: "Task not found" }, { status: 404 });
  } catch (error) {
    return errorResponse(error, "GET /api/tasks/:id");
  }
}

async function update(request: NextRequest, context: Context) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
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
  } catch (error) {
    return errorResponse(error, "UPDATE /api/tasks/:id");
  }
}

export const PATCH = update;
export const PUT = update;

export async function DELETE(_request: NextRequest, context: Context) {
  try {
    const id = getId((await context.params).id);
    if (!(await taskService.findById(id)))
      return NextResponse.json({ message: "Task not found" }, { status: 404 });
    await taskService.remove(id);
    return NextResponse.json({ message: "Task deleted" });
  } catch (error) {
    return errorResponse(error, "DELETE /api/tasks/:id");
  }
}
