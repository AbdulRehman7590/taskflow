import { NextRequest, NextResponse } from "next/server";
import { errorResponse, validateTaskInput } from "@/lib/api-handler";
import { taskService } from "@/lib/task-service";

export async function GET() {
  try {
    return NextResponse.json(await taskService.list());
  } catch (error) {
    return errorResponse(error, "GET /api/tasks");
  }
}

export async function POST(request: NextRequest) {
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
    const task = await taskService.create({
      title: (body.title as string).trim(),
      description:
        typeof body.description === "string"
          ? body.description.trim()
          : undefined,
      status: body.status as string | undefined,
    });
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    return errorResponse(error, "POST /api/tasks");
  }
}
