import { NextResponse } from "next/server";
import { parseInput, withApiHandler } from "@/lib/api-handler";
import { toCsv } from "@/lib/csv";
import { todayUtc } from "@/lib/dates";
import { taskListQuerySchema } from "@/lib/validations";
import { listUsers, requireUser, taskService } from "@/services";

export const GET = withApiHandler("GET /api/tasks/export", async (request) => {
  const user = await requireUser(request);
  const query = parseInput(
    taskListQuerySchema,
    Object.fromEntries(request.nextUrl.searchParams),
  );
  const [tasks, statuses, users] = await Promise.all([
    taskService.export(query, user.id),
    taskService.listStatuses(),
    listUsers(),
  ]);
  const names = new Map(users.map((member) => [member.id, member.name]));
  const stages = new Map(statuses.map((status) => [status.key, status.name]));
  const csv = toCsv([
    [
      "ID",
      "Title",
      "Description",
      "Status",
      "Priority",
      "Assignee",
      "Deadline",
      "Created",
      "Updated",
    ],
    ...tasks.map((task) => [
      task.id,
      task.title,
      task.description,
      stages.get(task.status) ?? task.status,
      task.priority,
      task.assigneeId
        ? (names.get(task.assigneeId) ?? "Unassigned")
        : "Unassigned",
      task.deadline?.slice(0, 10) ?? "",
      task.createdAt,
      task.updatedAt,
    ]),
  ]);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="taskflow-${todayUtc()}.csv"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
});
