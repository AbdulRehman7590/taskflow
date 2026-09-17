import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { env } from "@/lib/env";

const globalForDatabase = globalThis as unknown as {
  pool?: Pool;
  databaseReady?: Promise<void>;
};

export const pool =
  globalForDatabase.pool ?? new Pool({ connectionString: env.databaseUrl });
export const db = drizzle(pool, { schema });

if (process.env.NODE_ENV !== "production") globalForDatabase.pool = pool;

export function initializeDatabase() {
  if (!globalForDatabase.databaseReady) {
    globalForDatabase.databaseReady = (async () => {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'user',
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS tasks (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          status TEXT NOT NULL DEFAULT 'TODO',
          priority TEXT NOT NULL DEFAULT 'medium',
          deadline TIMESTAMP,
          position INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);

      await db.execute(
        sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'medium'`,
      );

      await db.execute(
        sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS deadline TIMESTAMP`,
      );

      await db.execute(
        sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS position INTEGER NOT NULL DEFAULT 0`,
      );

      await db.execute(sql`
        WITH ranked AS (
          SELECT id, ROW_NUMBER() OVER (
            PARTITION BY status ORDER BY created_at, id
          ) - 1 AS next_position
          FROM tasks
        )
        UPDATE tasks
        SET position = ranked.next_position
        FROM ranked
        WHERE tasks.id = ranked.id
          AND tasks.position = 0
      `);

      await db.execute(sql`
        CREATE UNIQUE INDEX IF NOT EXISTS tasks_title_idx ON tasks(title)
      `);

      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS tasks_status_position_idx
        ON tasks(status, position)
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS statuses (
          id SERIAL PRIMARY KEY,
          key TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          position INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS attachments (
          id SERIAL PRIMARY KEY,
          task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
          file_name TEXT NOT NULL,
          mime_type TEXT NOT NULL,
          size INTEGER NOT NULL,
          pathname TEXT NOT NULL,
          url TEXT NOT NULL,
          storage_provider TEXT NOT NULL DEFAULT 'blob',
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);

      await db.execute(sql`
        ALTER TABLE attachments
        ADD COLUMN IF NOT EXISTS storage_provider TEXT NOT NULL DEFAULT 'blob'
      `);

      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS attachments_task_id_idx
        ON attachments(task_id)
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS pending_attachments (
          token TEXT PRIMARY KEY,
          uploaded_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          file_name TEXT NOT NULL,
          mime_type TEXT NOT NULL,
          size INTEGER NOT NULL,
          pathname TEXT NOT NULL,
          url TEXT NOT NULL,
          storage_provider TEXT NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);

      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS pending_attachments_expiry_idx
        ON pending_attachments(expires_at)
      `);

      if (env.adminEmail && env.adminPassword) {
        const { hash } = await import("bcrypt");
        const passwordHash = await hash(
          env.adminPassword,
          env.passwordHashRounds,
        );

        await db.execute(sql`
          INSERT INTO users (name, email, password_hash, role)
          VALUES (${env.adminName}, ${env.adminEmail.toLowerCase()}, ${passwordHash}, 'admin')
          ON CONFLICT (email) DO UPDATE
          SET name = EXCLUDED.name,
              password_hash = EXCLUDED.password_hash,
              role = 'admin'
        `);
      }

      const defaults = env.defaultStatuses.split(",").map((item, position) => {
        const [key, ...name] = item.split(":");
        return { key: key?.trim(), name: name.join(":").trim(), position };
      });

      for (const status of defaults) {
        if (!status.key || !status.name) continue;
        await db.execute(sql`
          INSERT INTO statuses (key, name, position)
          VALUES (${status.key}, ${status.name}, ${status.position})
          ON CONFLICT (key) DO NOTHING
        `);
      }
    })();
  }

  return globalForDatabase.databaseReady;
}
