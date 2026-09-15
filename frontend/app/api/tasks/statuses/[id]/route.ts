import { NextRequest, NextResponse } from "next/server";
import { errorResponse, getId, validateStatusInput } from "@/lib/api-handler";
import { taskService } from "@/lib/task-service";

type Context = { params: Promise<{ id: string }> };

async function update(request: NextRequest, context: Context) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    validateStatusInput(body);
    const status = await taskService.updateStatus(
      getId((await context.params).id),
      { name: body.name as string },
    );
    return status
      ? NextResponse.json(status)
      : NextResponse.json({ message: "Status not found" }, { status: 404 });
  } catch (error) {
    return errorResponse(error, "UPDATE /api/tasks/statuses/:id");
  }
}

export const PATCH = update;
export const PUT = update;

export async function DELETE(_request: NextRequest, context: Context) {
  try {
    const result = await taskService.deleteStatus(
      getId((await context.params).id),
    );
    if (result === "missing")
      return NextResponse.json(
        { message: "Status not found" },
        { status: 404 },
      );
    if (result === "protected")
      return NextResponse.json(
        { message: "Completed is required and cannot be deleted." },
        { status: 400 },
      );
    if (result === "in_use")
      return NextResponse.json(
        { message: "Move the tasks in this status before deleting it." },
        { status: 409 },
      );
    return NextResponse.json({ message: "Status deleted" });
  } catch (error) {
    return errorResponse(error, "DELETE /api/tasks/statuses/:id");
  }
}
