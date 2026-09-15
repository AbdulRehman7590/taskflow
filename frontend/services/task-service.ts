import { asc, desc, eq } from "drizzle-orm";
import { db, initializeDatabase } from "@/lib/db";
import { statuses, tasks } from "@/lib/db/schema";
import type { StatusInput, TaskInput } from "@/types";

function orderStatuses<T extends { position: number }>(items: T[]) {
  return [...items].sort((left, right) => left.position - right.position);
}

export const taskService = {
  async list() {
    await initializeDatabase();
    return db.select().from(tasks).orderBy(desc(tasks.createdAt));
  },

  async findById(id: number) {
    await initializeDatabase();
    return (await db.select().from(tasks).where(eq(tasks.id, id)))[0];
  },

  async create(input: TaskInput) {
    await initializeDatabase();
    return (await db.insert(tasks).values(input).returning())[0];
  },

  async update(id: number, input: Partial<TaskInput>) {
    await initializeDatabase();
    return (
      await db
        .update(tasks)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(tasks.id, id))
        .returning()
    )[0];
  },

  async remove(id: number) {
    await initializeDatabase();
    return db.delete(tasks).where(eq(tasks.id, id));
  },

  async listStatuses() {
    await initializeDatabase();
    return orderStatuses(
      await db
        .select()
        .from(statuses)
        .orderBy(asc(statuses.position), asc(statuses.id)),
    );
  },

  async statusExists(key: string) {
    await initializeDatabase();
    return Boolean(
      (
        await db
          .select({ id: statuses.id })
          .from(statuses)
          .where(eq(statuses.key, key))
      )[0],
    );
  },

  async createStatus(input: StatusInput) {
    await initializeDatabase();
    const existing = await db
      .select()
      .from(statuses)
      .orderBy(desc(statuses.position), desc(statuses.id));
    const key = input.name
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_");
    return (
      await db
        .insert(statuses)
        .values({ key, name: input.name.trim(), position: existing.length })
        .returning()
    )[0];
  },

  async updateStatus(id: number, input: StatusInput) {
    await initializeDatabase();
    return (
      await db
        .update(statuses)
        .set({ name: input.name.trim() })
        .where(eq(statuses.id, id))
        .returning()
    )[0];
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
    const current = await this.listStatuses();
    const requested = orderedIds
      .map((id) => current.find((status) => status.id === id))
      .filter(
        (status): status is (typeof current)[number] => status !== undefined,
      );
    await Promise.all(
      requested.map((status, position) =>
        db.update(statuses).set({ position }).where(eq(statuses.id, status.id)),
      ),
    );
    return this.listStatuses();
  },
};
