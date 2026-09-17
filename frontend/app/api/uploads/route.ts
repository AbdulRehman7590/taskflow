import { NextResponse } from "next/server";
import { ApiError, withApiHandler } from "@/lib/api-handler";
import { attachmentService, requireUser } from "@/services";

/** Stages an attachment before task creation. No task row exists yet. */
export const POST = withApiHandler("POST /api/uploads", async (request) => {
  const user = await requireUser(request, "admin");
  const formData = await request.formData().catch(() => {
    throw new ApiError("Upload must contain valid form data.", 400);
  });
  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new ApiError("Choose a file to upload.", 400);
  }
  return NextResponse.json(await attachmentService.stage(user.id, file), {
    status: 201,
  });
});
