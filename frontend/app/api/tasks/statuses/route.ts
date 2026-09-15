import { NextRequest, NextResponse } from "next/server";
import { errorResponse, validateStatusInput } from "@/lib/api-handler";
import { taskService } from "@/lib/task-service";

export async function GET() {
  try {
    return NextResponse.json(await taskService.listStatuses());
  } catch (error) {
    return errorResponse(error, "GET /api/tasks/statuses");
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    validateStatusInput(body);
    return NextResponse.json(
      await taskService.createStatus({ name: body.name as string }),
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error, "POST /api/tasks/statuses");
  }
}
