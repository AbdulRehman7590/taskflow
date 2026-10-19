import { NextResponse } from "next/server";
import { parseJson, withApiHandler } from "@/lib/api-handler";
import { revalidateTasks } from "@/lib/cache";
import { taskOrderSchema } from "@/lib/validations";
import { requireUser, taskService } from "@/services";

export const PATCH = withApiHandler(
  "PATCH /api/tasks/order",
  async (request) => {
    await requireUser(request, "admin");
    const { status, orderedIds } = await parseJson(request, taskOrderSchema);
    await taskService.reorderTasks(status, orderedIds);
    revalidateTasks();
    return NextResponse.json({ message: "Task order updated." });
  },
);
