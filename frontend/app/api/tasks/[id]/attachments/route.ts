import { NextResponse } from "next/server";
import { ApiError, getId, withApiHandler } from "@/lib/api-handler";
import { revalidateTasks } from "@/lib/cache";
import { attachmentService, requireUser } from "@/services";
import type { RouteContext } from "@/types";

export const POST = withApiHandler<RouteContext>(
  "POST /api/tasks/:id/attachments",
  async (request, context) => {
    await requireUser(request, "admin");
    const taskId = getId((await context.params).id, "task id");

    const formData = await request.formData().catch(() => {
      throw new ApiError("Upload must contain valid form data.", 400);
    });
    const file = formData.get("file");
    if (!(file instanceof File)) {
      throw new ApiError("Choose a file to upload.", 400);
    }

    const attachment = await attachmentService.create(taskId, file);
    revalidateTasks();
    return NextResponse.json(attachment, { status: 201 });
  },
);
