import { NextResponse } from "next/server";
import { parseInput, withApiHandler } from "@/lib/api-handler";
import { taskListQuerySchema } from "@/lib/validations";
import { requireUser, taskService } from "@/services";

export const GET = withApiHandler("GET /api/tasks", async (request) => {
  await requireUser(request);
  const query = parseInput(
    taskListQuerySchema,
    Object.fromEntries(request.nextUrl.searchParams),
  );
  return NextResponse.json(await taskService.list(query));
});
