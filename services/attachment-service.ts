import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { del, put } from "@vercel/blob";
import { and, asc, eq, gt, inArray, lt } from "drizzle-orm";
import { ApiError, parseInput } from "@/lib/api-handler";
import { db, initializeDatabase } from "@/lib/db";
import { attachments, pendingAttachments, tasks } from "@/lib/db/schema";
import { blobToken, env } from "@/lib/env";
import { attachmentMetadataSchema } from "@/lib/validations";

function safeFileName(fileName: string) {
  return (
    fileName
      .normalize("NFKD")
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "attachment"
  );
}

function blobPath(prefix: string, fileName: string) {
  const safeName = safeFileName(fileName);
  return `${prefix}/${randomUUID()}-${safeName}`;
}

function localDirectory() {
  return path.resolve(
    /*turbopackIgnore: true*/
    process.cwd(),
    env.localUploadDirectory,
  );
}

async function storeFile(
  file: File,
  storageKey: string,
  blobPrefix = "pending",
) {
  if (env.blobReadWriteToken) {
    const blob = await put(blobPath(blobPrefix, file.name), file, {
      access: "public",
      addRandomSuffix: false,
      contentType: file.type,
      ...blobToken(),
    });
    return {
      pathname: blob.pathname,
      url: blob.url,
      storageProvider: "blob" as const,
    };
  }

  if (process.env.NODE_ENV === "production") {
    throw new ApiError(
      "File storage is not configured. Set BLOB_READ_WRITE_TOKEN.",
      503,
    );
  }

  await mkdir(localDirectory(), { recursive: true });
  await writeFile(
    path.join(/*turbopackIgnore: true*/ localDirectory(), storageKey),
    Buffer.from(await file.arrayBuffer()),
  );
  return {
    pathname: storageKey,
    url: `/api/files/${storageKey}`,
    storageProvider: "local" as const,
  };
}

async function deleteStoredFile(row: {
  storageProvider: string;
  pathname: string;
  url: string;
}) {
  if (row.storageProvider === "local") {
    await unlink(
      path.join(/*turbopackIgnore: true*/ localDirectory(), row.pathname),
    ).catch(() => undefined);
    return;
  }
  if (env.blobReadWriteToken) {
    await del(row.url, blobToken()).catch(() => undefined);
  }
}

export const attachmentService = {
  async list(taskId: number) {
    await initializeDatabase();
    return db
      .select()
      .from(attachments)
      .where(eq(attachments.taskId, taskId))
      .orderBy(asc(attachments.id));
  },

  async listForTasks(taskIds: number[]) {
    if (!taskIds.length) return [];
    await initializeDatabase();
    return db
      .select()
      .from(attachments)
      .where(inArray(attachments.taskId, taskIds))
      .orderBy(asc(attachments.id));
  },

  async create(taskId: number, file: File) {
    await initializeDatabase();

    const metadata = parseInput(attachmentMetadataSchema, {
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
    });

    const task = (
      await db.select({ id: tasks.id }).from(tasks).where(eq(tasks.id, taskId))
    )[0];
    if (!task) throw new ApiError("Task not found.", 404);

    const stored = await storeFile(file, randomUUID(), `tasks/${taskId}`);

    try {
      return (
        await db
          .insert(attachments)
          .values({
            taskId,
            fileName: metadata.fileName,
            mimeType: metadata.mimeType,
            size: metadata.size,
            ...stored,
          })
          .returning()
      )[0];
    } catch (error) {
      await deleteStoredFile(stored);
      throw error;
    }
  },

  async stage(uploadedBy: number, file: File) {
    await initializeDatabase();
    await this.cleanupExpired();
    const metadata = parseInput(attachmentMetadataSchema, {
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
    });
    const token = randomUUID();
    const stored = await storeFile(file, token);

    try {
      const row = (
        await db
          .insert(pendingAttachments)
          .values({
            token,
            uploadedBy,
            ...metadata,
            ...stored,
            expiresAt: new Date(Date.now() + env.pendingUploadMinutes * 60_000),
          })
          .returning()
      )[0];
      return {
        token: row.token,
        fileName: row.fileName,
        mimeType: row.mimeType,
        size: row.size,
        previewUrl: row.url,
      };
    } catch (error) {
      await deleteStoredFile(stored);
      throw error;
    }
  },

  async discard(tokens: string[], uploadedBy: number) {
    if (!tokens.length) return;
    await initializeDatabase();
    const rows = await db
      .delete(pendingAttachments)
      .where(
        and(
          inArray(pendingAttachments.token, tokens),
          eq(pendingAttachments.uploadedBy, uploadedBy),
        ),
      )
      .returning();
    await Promise.all(rows.map(deleteStoredFile));
  },

  async cleanupExpired() {
    const rows = await db
      .delete(pendingAttachments)
      .where(lt(pendingAttachments.expiresAt, new Date()))
      .returning();
    await Promise.all(rows.map(deleteStoredFile));
  },

  async readLocal(pathname: string, userId: number) {
    await initializeDatabase();
    const stored = (
      await db
        .select({
          pathname: attachments.pathname,
          mimeType: attachments.mimeType,
          storageProvider: attachments.storageProvider,
        })
        .from(attachments)
        .where(eq(attachments.pathname, pathname))
    )[0];
    const pending = stored
      ? undefined
      : (
          await db
            .select({
              pathname: pendingAttachments.pathname,
              mimeType: pendingAttachments.mimeType,
              storageProvider: pendingAttachments.storageProvider,
            })
            .from(pendingAttachments)
            .where(
              and(
                eq(pendingAttachments.pathname, pathname),
                gt(pendingAttachments.expiresAt, new Date()),
                eq(pendingAttachments.uploadedBy, userId),
              ),
            )
        )[0];
    const row = stored ?? pending;
    if (!row || row.storageProvider !== "local") return null;
    return {
      bytes: await readFile(
        path.join(/*turbopackIgnore: true*/ localDirectory(), row.pathname),
      ).catch(() => null),
      mimeType: row.mimeType,
    };
  },

  async remove(taskId: number, attachmentId: number) {
    await initializeDatabase();

    const attachment = (
      await db
        .select()
        .from(attachments)
        .where(
          and(eq(attachments.id, attachmentId), eq(attachments.taskId, taskId)),
        )
    )[0];
    if (!attachment) return null;

    await deleteStoredFile(attachment);
    await db.delete(attachments).where(eq(attachments.id, attachmentId));
    return attachment;
  },

  async removeForTask(taskId: number) {
    const existing = await this.list(taskId);
    if (!existing.length) return;
    await Promise.all(existing.map(deleteStoredFile));
  },
};
