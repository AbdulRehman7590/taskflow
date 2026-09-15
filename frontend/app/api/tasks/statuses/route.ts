import { NextRequest, NextResponse } from "next/server";
import { readJson, validateStatusInput, withApiHandler } from "@/lib/api-handler";
import { requireUser, taskService } from "@/services";

export const GET = withApiHandler("GET /api/tasks/statuses", async (request) => {
  await requireUser(request);
  return NextResponse.json(await taskService.listStatuses());
});

export const POST = withApiHandler("POST /api/tasks/statuses", async (request) => {
  await requireUser(request, "admin");
  const body = await readJson(request);
  validateStatusInput(body);
  return NextResponse.json(await taskService.createStatus({ name: body.name as string }), { status: 201 });
});
