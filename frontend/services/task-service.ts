import { unstable_cache } from "next/cache";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  ilike,
  inArray,
  lt,
  max,
  ne,
  or,
  sql,
} from "drizzle-orm";
import { ApiError } from "@/lib/api-handler";
import { CACHE_TAGS } from "@/lib/cache";
import { db, initializeDatabase } from "@/lib/db";
import {
  attachments,
  pendingAttachments,
  statuses,
  tasks,
} from "@/lib/db/schema";
import { orderStatuses } from "@/lib/utils";
import { attachmentService } from "./attachment-service";
import type {
  Attachment,
  Status,
  Task,
  TaskListQuery,
  TaskPage,
} from "@/types";

type StatusRow = typeof statuses.$inferSelect;
type TaskRow = typeof tasks.$inferSelect;

const SORT_COLUMNS = {
  createdAt: tasks.createdAt,
  updatedAt: tasks.updatedAt,
  deadline: tasks.deadline,
};

function toStatus(row: StatusRow): Status {
  return { ...row, createdAt: row.createdAt.toISOString() };
}

function toTask(row: TaskRow, rowAttachments: Attachment[] = []): Task {
  return {
    ...row,
    priority: row.priority as Task["priority"],
    deadline: row.deadline?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    attachments: rowAttachments,
  };
}

async function readStatuses() {
  await initializeDatabase();

  const rows = await db
    .select()
    .from(statuses)
    .orderBy(asc(statuses.position), asc(statuses.id));
  return orderStatuses(rows).map(toStatus);
}

const readCachedStatuses = unstable_cache(readStatuses, ["task-statuses"], {
  revalidate: 3600,
  tags: [CACHE_TAGS.statuses],
});

async function withAttachments(rows: TaskRow[]): Promise<Task[]> {
  const found = await attachmentService.listForTasks(rows.map((row) => row.id));
  return rows.map((row) =>
    toTask(
      row,
      found
        .filter((attachment) => attachment.taskId === row.id)
        .map((attachment) => ({
          ...attachment,
          storageProvider: attachment.storageProvider as "blob" | "local",
          createdAt: attachment.createdAt.toISOString(),
        })),
    ),
  );
}

async function readActiveHighPriorityTasks() {
  await initializeDatabase();
  const rows = await db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.priority, "high"),
        gt(tasks.deadline, new Date()),
        ne(tasks.status, "COMPLETED"),
      ),
    )
    .orderBy(asc(tasks.deadline), asc(tasks.position));
  return withAttachments(rows);
}

const readCachedActiveHighPriorityTasks = unstable_cache(
  readActiveHighPriorityTasks,
  ["active-high-priority-tasks"],
  {
    revalidate: 60,
    tags: [CACHE_TAGS.activeHighPriorityTasks],
  },
);

export const taskService = {
  async list(query: TaskListQuery): Promise<TaskPage> {
    await initializeDatabase();

    const search = query.q
      ? or(
          ilike(tasks.title, `%${query.q}%`),
          ilike(tasks.description, `%${query.q}%`),
        )
      : undefined;

    const deadlineStart = query.deadline
      ? new Date(`${query.deadline}T00:00:00`)
      : undefined;

    const deadlineEnd = deadlineStart
      ? new Date(deadlineStart.getTime() + 86_400_000)
      : undefined;

    const deadlineFilter =
      deadlineStart && deadlineEnd
        ? and(
            gte(tasks.deadline, deadlineStart),
            lt(tasks.deadline, deadlineEnd),
          )
        : undefined;

    const where = and(search, deadlineFilter);

    const priorityPin =
      query.priority === "ALL"
        ? undefined
        : sql<number>`case when ${tasks.priority} = ${query.priority} then 0 else 1 end`;

    const priorityOrder = sql<number>`case ${tasks.priority}
      when 'high' then 0 when 'medium' then 1 else 2 end`;

    const sortOrder =
      query.sort === "priority"
        ? priorityOrder
        : query.sort === "position"
          ? asc(tasks.position)
          : query.sort === "deadline"
            ? asc(tasks.deadline)
            : desc(SORT_COLUMNS[query.sort]);

    const baseQuery = db
      .select()
      .from(tasks)
      .where(where)
      .orderBy(
        ...(priorityPin ? [priorityPin] : []),
        sortOrder,
        asc(tasks.position),
        asc(tasks.id),
      );

    const rowsQuery =
      query.view === "board"
        ? baseQuery
        : baseQuery
            .limit(query.pageSize)
            .offset((query.page - 1) * query.pageSize);

    const [rows, totals, statusCounts] = await Promise.all([
      rowsQuery,
      db.select({ value: count() }).from(tasks).where(where),

      db
        .select({ status: tasks.status, value: count() })
        .from(tasks)
        .where(where)
        .groupBy(tasks.status),
    ]);

    const total = totals[0]?.value ?? 0;

    const byStatus = Object.fromEntries(
      statusCounts.map(({ status, value }) => [status, value]),
    );

    return {
      items: await withAttachments(rows),
      page: query.view === "board" ? 1 : query.page,
      pageSize: query.pageSize,
      total,
      totalPages:
        query.view === "board"
          ? 1
          : Math.max(1, Math.ceil(total / query.pageSize)),
      stats: {
        total: Object.values(byStatus).reduce((sum, value) => sum + value, 0),
        byStatus,
      },
    };
  },

  async create(
    input: {
      title: string;
      description?: string;
      priority: Task["priority"];
      deadline?: string;
      stagedAttachmentTokens: string[];
    },
    uploadedBy: number,
  ) {
    await initializeDatabase();

    const duplicate = (
      await db
        .select({ id: tasks.id })
        .from(tasks)
        .where(ilike(tasks.title, input.title))
    )[0];
    if (duplicate) {
      throw new ApiError("A task with this title already exists.", 409, {
        title: ["Task titles must be unique."],
      });
    }

    return db.transaction(async (tx) => {
      const staged = input.stagedAttachmentTokens.length
        ? await tx
            .select()
            .from(pendingAttachments)
            .where(
              and(
                inArray(pendingAttachments.token, input.stagedAttachmentTokens),
                eq(pendingAttachments.uploadedBy, uploadedBy),
              ),
            )
        : [];
      if (staged.length !== input.stagedAttachmentTokens.length) {
        throw new ApiError(
          "One or more attachments expired. Upload them again.",
          400,
        );
      }

      const currentMax = (
        await tx
          .select({ value: max(tasks.position) })
          .from(tasks)
          .where(eq(tasks.status, "TODO"))
      )[0]?.value;
      const row = (
        await tx
          .insert(tasks)
          .values({
            title: input.title,
            description: input.description,
            status: "TODO",
            priority: input.priority,
            deadline: input.deadline
              ? new Date(`${input.deadline}T23:59:59.999`)
              : null,
            position: (currentMax ?? -1) + 1,
          })
          .returning()
      )[0];

      const createdAttachments = staged.length
        ? await tx
            .insert(attachments)
            .values(
              staged.map((file) => ({
                taskId: row.id,
                fileName: file.fileName,
                mimeType: file.mimeType,
                size: file.size,
                pathname: file.pathname,
                url: file.url,
                storageProvider: file.storageProvider,
              })),
            )
            .returning()
        : [];
      if (staged.length) {
        await tx.delete(pendingAttachments).where(
          inArray(
            pendingAttachments.token,
            staged.map((file) => file.token),
          ),
        );
      }
      return toTask(
        row,
        createdAttachments.map((file) => ({
          ...file,
          storageProvider: file.storageProvider as "blob" | "local",
          createdAt: file.createdAt.toISOString(),
        })),
      );
    });
  },

  async update(
    id: number,
    input: {
      title?: string;
      description?: string;
      status?: string;
      priority?: Task["priority"];
      deadline?: string;
    },
  ) {
    await initializeDatabase();
    await this.assertStatusExists(input.status);
    const existingTask = (
      await db
        .select({ status: tasks.status })
        .from(tasks)
        .where(eq(tasks.id, id))
    )[0];
    if (!existingTask) return undefined;
    if (input.title) {
      const duplicate = (
        await db
          .select({ id: tasks.id })
          .from(tasks)
          .where(and(ilike(tasks.title, input.title), ne(tasks.id, id)))
      )[0];
      if (duplicate) {
        throw new ApiError("A task with this title already exists.", 409, {
          title: ["Task titles must be unique."],
        });
      }
    }
    const { deadline, ...rest } = input;
    const targetPosition =
      input.status !== undefined && input.status !== existingTask.status
        ? ((
            await db
              .select({ value: max(tasks.position) })
              .from(tasks)
              .where(eq(tasks.status, input.status))
          )[0]?.value ?? -1) + 1
        : undefined;
    const row = (
      await db
        .update(tasks)
        .set({
          ...rest,
          ...(targetPosition !== undefined ? { position: targetPosition } : {}),
          ...(deadline !== undefined
            ? {
                deadline: deadline
                  ? new Date(`${deadline}T23:59:59.999`)
                  : null,
              }
            : {}),
          updatedAt: new Date(),
        })
        .where(eq(tasks.id, id))
        .returning()
    )[0];
    if (!row) return undefined;
    return (await withAttachments([row]))[0];
  },

  async remove(id: number) {
    await initializeDatabase();
    const row = (await db.select().from(tasks).where(eq(tasks.id, id)))[0];
    if (!row) return false;
    await attachmentService.removeForTask(id);
    await db.delete(tasks).where(eq(tasks.id, id));
    return true;
  },

  async assertStatusExists(key?: string) {
    if (!key) return;
    const found = (
      await db
        .select({ id: statuses.id })
        .from(statuses)
        .where(eq(statuses.key, key))
    )[0];
    if (!found) throw new ApiError("Unknown task status.", 400);
  },

  async reorderTasks(status: string, orderedIds: number[]) {
    await initializeDatabase();
    const current = await db
      .select({ id: tasks.id })
      .from(tasks)
      .where(eq(tasks.status, status))
      .orderBy(asc(tasks.position), asc(tasks.id));
    const currentIds = current.map((task) => task.id);
    if (
      currentIds.length !== orderedIds.length ||
      currentIds.some((id) => !orderedIds.includes(id))
    ) {
      throw new ApiError(
        "The board changed while you were ordering it. Refresh and try again.",
        409,
      );
    }
    await db.transaction(async (tx) => {
      await Promise.all(
        orderedIds.map((id, position) =>
          tx
            .update(tasks)
            .set({ position, updatedAt: new Date() })
            .where(and(eq(tasks.id, id), eq(tasks.status, status))),
        ),
      );
    });
  },

  listStatuses(): Promise<Status[]> {
    return readCachedStatuses();
  },

  listActiveHighPriorityTasks(): Promise<Task[]> {
    return readCachedActiveHighPriorityTasks();
  },

  async createStatus(input: { name: string }) {
    await initializeDatabase();
    const existing = await readStatuses();
    const row = (
      await db
        .insert(statuses)
        .values({
          key: input.name.toUpperCase().replace(/[^A-Z0-9]+/g, "_"),
          name: input.name,
          position: existing.length,
        })
        .returning()
    )[0];
    return toStatus(row);
  },

  async updateStatus(id: number, input: { name: string }) {
    await initializeDatabase();
    const row = (
      await db
        .update(statuses)
        .set({ name: input.name })
        .where(eq(statuses.id, id))
        .returning()
    )[0];
    return row ? toStatus(row) : undefined;
  },

  async deleteStatus(id: number) {
    await initializeDatabase();
    const status = (
      await db.select().from(statuses).where(eq(statuses.id, id))
    )[0];
    if (!status) return "missing" as const;

    const assigned = (
      await db
        .select({ id: tasks.id })
        .from(tasks)
        .where(eq(tasks.status, status.key))
    )[0];
    if (assigned) return "in_use" as const;

    await db.delete(statuses).where(eq(statuses.id, id));
    return "deleted" as const;
  },

  async reorderStatuses(orderedIds: number[]) {
    await initializeDatabase();
    const current = await readStatuses();
    const known = orderedIds.filter((id) =>
      current.some((status) => status.id === id),
    );

    await Promise.all(
      known.map((id, position) =>
        db.update(statuses).set({ position }).where(eq(statuses.id, id)),
      ),
    );
    return readStatuses();
  },
};
