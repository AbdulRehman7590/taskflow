import { NextResponse } from "next/server";
import { ApiError, getId, withApiHandler } from "@/lib/api-handler";
import { revalidateTasks } from "@/lib/cache";
import { attachmentService, requireUser } from "@/services";

type AttachmentContext = {
  params: Promise<{ id: string; attachmentId: string }>;
};

export const DELETE = withApiHandler<AttachmentContext>(
  "DELETE /api/tasks/:id/attachments/:attachmentId",
  async (request, context) => {
    await requireUser(request, "admin");
    const { id, attachmentId } = await context.params;

    const deleted = await attachmentService.remove(
      getId(id, "task id"),
      getId(attachmentId, "attachment id"),
    );
    if (!deleted) throw new ApiError("Attachment not found.", 404);

    revalidateTasks();
    return NextResponse.json({ message: "Attachment deleted." });
  },
);
