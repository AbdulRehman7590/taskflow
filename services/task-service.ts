import { unstable_cache } from "next/cache";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lt,
  max,
  ne,
  isNull,
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
  users,
} from "@/lib/db/schema";
import { addUtcDays, todayUtc } from "@/lib/dates";
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
    deadline: row.deadline ?? null,
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
  const byTask = new Map<number, Attachment[]>();
  for (const file of found) {
    const files = byTask.get(file.taskId) ?? [];
    files.push({
      ...file,
      storageProvider: file.storageProvider as "blob" | "local",
      createdAt: file.createdAt.toISOString(),
    });
    byTask.set(file.taskId, files);
  }
  return rows.map((row) => toTask(row, byTask.get(row.id)));
}

function taskFilters(query: TaskListQuery, userId: number) {
  const escapedSearch = query.q.replace(/[\\%_]/g, "\\$&");
  const today = todayUtc();
  const week = addUtcDays(today, 7);
  const active = ne(tasks.status, "COMPLETED");
  return and(
    query.q
      ? or(
          ilike(tasks.title, `%${escapedSearch}%`),
          ilike(tasks.description, `%${escapedSearch}%`),
        )
      : undefined,
    query.priority !== "ALL" ? eq(tasks.priority, query.priority) : undefined,
    query.status !== "ALL" ? eq(tasks.status, query.status) : undefined,
    query.assignee === "UNASSIGNED"
      ? isNull(tasks.assigneeId)
      : query.assignee !== "ALL"
        ? eq(
            tasks.assigneeId,
            query.assignee === "ME" ? userId : Number(query.assignee),
          )
        : undefined,
    query.deadline ? eq(tasks.deadline, query.deadline) : undefined,
    query.due === "overdue"
      ? and(active, lt(tasks.deadline, today))
      : query.due === "today"
        ? and(active, eq(tasks.deadline, today))
        : query.due === "week"
          ? and(active, gte(tasks.deadline, today), lt(tasks.deadline, week))
          : query.due === "none"
            ? isNull(tasks.deadline)
            : undefined,
  );
}

function taskOrder(query: TaskListQuery) {
  const primary =
    query.sort === "priority"
      ? sql`case ${tasks.priority} when 'high' then 0 when 'medium' then 1 else 2 end`
      : query.sort === "position"
        ? asc(tasks.position)
        : query.sort === "deadline"
          ? sql`${tasks.deadline} asc nulls last`
          : desc(SORT_COLUMNS[query.sort]);
  return [primary, asc(tasks.position), asc(tasks.id)];
}

export const taskService = {
  async list(query: TaskListQuery, userId: number): Promise<TaskPage> {
    await initializeDatabase();

    const where = taskFilters(query, userId);
    const today = todayUtc();
    const [totals, statusCounts] = await Promise.all([
      db
        .select({
          value: count(),
          overdue: sql<number>`count(*) filter (where ${tasks.deadline} < ${today} and ${tasks.status} <> 'COMPLETED')::int`,
          dueToday: sql<number>`count(*) filter (where ${tasks.deadline} = ${today} and ${tasks.status} <> 'COMPLETED')::int`,
          highPriority: sql<number>`count(*) filter (where ${tasks.priority} = 'high' and ${tasks.status} <> 'COMPLETED')::int`,
        })
        .from(tasks)
        .where(where),
      db
        .select({ status: tasks.status, value: count() })
        .from(tasks)
        .where(where)
        .groupBy(tasks.status),
    ]);

    const total = totals[0]?.value ?? 0;
    const totalPages =
      query.view === "board"
        ? 1
        : Math.max(1, Math.ceil(total / query.pageSize));
    const page = Math.min(query.page, totalPages);
    const base = db
      .select()
      .from(tasks)
      .where(where)
      .orderBy(...taskOrder(query));
    const rows = await (query.view === "board"
      ? base
      : base.limit(query.pageSize).offset((page - 1) * query.pageSize));

    const byStatus = Object.fromEntries(
      statusCounts.map(({ status, value }) => [status, value]),
    );

    return {
      items: await withAttachments(rows),
      page,
      pageSize: query.pageSize,
      total,
      totalPages,
      stats: {
        total: Object.values(byStatus).reduce((sum, value) => sum + value, 0),
        byStatus,
        overdue: totals[0]?.overdue ?? 0,
        dueToday: totals[0]?.dueToday ?? 0,
        highPriority: totals[0]?.highPriority ?? 0,
      },
    };
  },

  async export(query: TaskListQuery, userId: number) {
    await initializeDatabase();
    const rows = await db
      .select()
      .from(tasks)
      .where(taskFilters(query, userId))
      .orderBy(...taskOrder(query));
    return rows.map((row) => toTask(row));
  },

  async create(
    input: {
      title: string;
      description?: string;
      priority: Task["priority"];
      deadline: string | null;
      assigneeId: number | null;
      stagedAttachmentTokens: string[];
    },
    uploadedBy: number,
  ) {
    await initializeDatabase();
    await this.assertAssigneeExists(input.assigneeId);

    const duplicate = (
      await db
        .select({ id: tasks.id })
        .from(tasks)
        .where(sql`lower(${tasks.title}) = lower(${input.title})`)
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
                gte(pendingAttachments.expiresAt, new Date()),
              ),
            )
            .for("update")
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
            deadline: input.deadline,
            assigneeId: input.assigneeId,
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
      deadline?: string | null;
      assigneeId?: number | null;
    },
  ) {
    await initializeDatabase();
    await this.assertStatusExists(input.status);
    await this.assertAssigneeExists(input.assigneeId);
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
          .where(
            and(
              sql`lower(${tasks.title}) = lower(${input.title})`,
              ne(tasks.id, id),
            ),
          )
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
                deadline,
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

  async assertAssigneeExists(id?: number | null) {
    if (id == null) return;
    const found = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, id));
    if (!found.length)
      throw new ApiError("Choose an existing team member.", 400, {
        assigneeId: ["This team member no longer exists."],
      });
  },

  async reorderTasks(status: string, orderedIds: number[]) {
    await initializeDatabase();
    await db.transaction(async (tx) => {
      const current = await tx
        .select({ id: tasks.id })
        .from(tasks)
        .where(eq(tasks.status, status))
        .orderBy(asc(tasks.position), asc(tasks.id))
        .for("update");
      const currentIds = current.map((task) => task.id);
      const requested = new Set(orderedIds);
      if (
        currentIds.length !== orderedIds.length ||
        requested.size !== orderedIds.length ||
        currentIds.some((id) => !requested.has(id))
      ) {
        throw new ApiError(
          "The board changed while you were ordering it. Refresh and try again.",
          409,
        );
      }
      if (orderedIds.length)
        await tx.execute(sql`
        UPDATE tasks SET position = ordered.position - 1, updated_at = NOW()
        FROM unnest(ARRAY[${sql.join(
          orderedIds.map((id) => sql`${id}`),
          sql`, `,
        )}]::integer[])
          WITH ORDINALITY AS ordered(id, position)
        WHERE tasks.id = ordered.id AND tasks.status = ${status}
      `);
    });
  },

  listStatuses(): Promise<Status[]> {
    return readCachedStatuses();
  },

  async createStatus(input: { name: string }) {
    await initializeDatabase();
    const existing = await readStatuses();
    if (existing.length >= 100)
      throw new ApiError("A workspace can have up to 100 statuses.", 400);
    const key = input.name
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    if (!key)
      throw new ApiError(
        "Use at least one letter or number in a status name.",
        400,
      );
    if (
      existing.some(
        (status) =>
          status.key === key ||
          status.name.toLowerCase() === input.name.toLowerCase(),
      )
    ) {
      throw new ApiError("A status with this name already exists.", 409);
    }
    const row = (
      await db
        .insert(statuses)
        .values({
          key,
          name: input.name,
          position:
            Math.max(-1, ...existing.map((status) => status.position)) + 1,
        })
        .returning()
    )[0];
    return toStatus(row);
  },

  async updateStatus(id: number, input: { name: string }) {
    await initializeDatabase();
    const existing = await readStatuses();
    if (
      existing.some(
        (status) =>
          status.id !== id &&
          status.name.toLowerCase() === input.name.toLowerCase(),
      )
    ) {
      throw new ApiError("A status with this name already exists.", 409);
    }
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
    if (status.key === "TODO" || status.key === "COMPLETED") {
      throw new ApiError(
        "The initial and completed stages are required. You can rename them.",
        409,
      );
    }

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
    const requested = new Set(orderedIds);
    if (
      requested.size !== orderedIds.length ||
      current.length !== orderedIds.length ||
      current.some((status) => !requested.has(status.id))
    ) {
      throw new ApiError("The workflow changed. Refresh and try again.", 409);
    }
    await db.execute(sql`
      UPDATE statuses SET position = ordered.position - 1
      FROM unnest(ARRAY[${sql.join(
        orderedIds.map((id) => sql`${id}`),
        sql`, `,
      )}]::integer[])
        WITH ORDINALITY AS ordered(id, position)
      WHERE statuses.id = ordered.id
    `);
    return readStatuses();
  },
};
