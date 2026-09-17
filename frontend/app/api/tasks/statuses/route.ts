import { NextResponse } from "next/server";
import { parseJson, withApiHandler } from "@/lib/api-handler";
import { revalidateStatuses } from "@/lib/cache";
import { statusSchema } from "@/lib/validations";
import { requireUser, taskService } from "@/services";

export const GET = withApiHandler(
  "GET /api/tasks/statuses",
  async (request) => {
    await requireUser(request);
    return NextResponse.json(await taskService.listStatuses());
  },
);

export const POST = withApiHandler(
  "POST /api/tasks/statuses",
  async (request) => {
    await requireUser(request, "admin");
    const status = await taskService.createStatus(
      await parseJson(request, statusSchema),
    );
    revalidateStatuses();
    return NextResponse.json(status, { status: 201 });
  },
);
