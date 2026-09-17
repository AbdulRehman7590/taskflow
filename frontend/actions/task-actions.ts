"use server";

import { ApiError, actionResult, getId, parseInput } from "@/lib/api-handler";
import { revalidateTasks } from "@/lib/cache";
import { createTaskSchema, taskFormSchema } from "@/lib/validations";
import { attachmentService, requireActionUser, taskService } from "@/services";
import type { ActionResult, Task } from "@/types";

export async function createTaskAction(
  input: unknown,
): Promise<ActionResult<Task>> {
  return actionResult(async () => {
    const user = await requireActionUser("admin");
    const parsed = parseInput(createTaskSchema, input);
    try {
      const task = await taskService.create(parsed, user.id);
      revalidateTasks();
      return task;
    } catch (error) {
      await attachmentService.discard(parsed.stagedAttachmentTokens, user.id);
      throw error;
    }
  });
}

export async function updateTaskAction(
  id: number,
  input: unknown,
): Promise<ActionResult<Task>> {
  return actionResult(async () => {
    await requireActionUser("admin");
    const task = await taskService.update(
      getId(String(id), "task id"),
      parseInput(taskFormSchema, input),
    );

    if (!task) throw new ApiError("Task not found.", 404);
    revalidateTasks();
    return task;
  });
}
