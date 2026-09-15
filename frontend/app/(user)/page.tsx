import TaskManager from "@/components/task-manager";
import { getSessionUser, taskService, SESSION_COOKIE } from "@/services";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import type { Status, Task } from "@/types";

export default async function Page() {
  const user = await getSessionUser();
  if (!user) {
    redirect((await cookies()).has(SESSION_COOKIE) ? "/logout" : "/login");
  }

  const [tasks, statuses] = await Promise.all([
    taskService.list(),
    taskService.listStatuses(),
  ]);

  const initialTasks = tasks.map(
    (task): Task => ({
      ...task,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    }),
  );

  const initialStatuses = statuses.map(
    (status): Status => ({
      ...status,
      createdAt: status.createdAt.toISOString(),
    }),
  );

  return (
    <TaskManager
      initialTasks={initialTasks}
      initialStatuses={initialStatuses}
      userRole={user.role}
    />
  );
}
