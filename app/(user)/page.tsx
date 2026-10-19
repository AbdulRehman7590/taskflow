import { TaskManager } from "@/components/tasks/task-manager";
import { taskListQuerySchema } from "@/lib/validations";
import { listUsers, requirePageUser, taskService } from "@/services";

/**
 * Server Component: reads the query from the URL, fetches the page of tasks on
 * the server and hands plain data to the client shell. No loading spinner is
 * needed here because `loading.tsx` streams while this runs.
 */
export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requirePageUser();
  const query = taskListQuerySchema.parse(await searchParams);
  const isAdmin = user.role === "admin";

  const [page, statuses, users] = await Promise.all([
    taskService.list(query, user.id),
    taskService.listStatuses(),
    listUsers(),
  ]);

  return (
    <TaskManager
      page={page}
      statuses={statuses}
      query={{ ...query, page: page.page }}
      isAdmin={isAdmin}
      users={users}
      currentUserId={user.id}
    />
  );
}
