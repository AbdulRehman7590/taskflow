import { NextRequest, NextResponse } from "next/server";
import { readJson, validateTaskInput, withApiHandler } from "@/lib/api-handler";
import { requireUser, taskService } from "@/services";

export const GET = withApiHandler("GET /api/tasks", async (request) => {
  await requireUser(request);
  return NextResponse.json(await taskService.list());
});

export const POST = withApiHandler("POST /api/tasks", async (request) => {
  await requireUser(request, "admin");
  const body = await readJson(request);
  validateTaskInput(body);
  if (body.status && !(await taskService.statusExists(body.status as string)))
    return NextResponse.json({ message: "Unknown task status" }, { status: 400 });
  const task = await taskService.create({ title: (body.title as string).trim(), description: typeof body.description === "string" ? body.description.trim() : undefined, status: body.status as string | undefined });
  return NextResponse.json(task, { status: 201 });
});
