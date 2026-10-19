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
  globalForDatabase.pool ??
  new Pool({
    connectionString: env.databaseUrl,
    max: 10,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
  });
export const db = drizzle(pool, { schema });

if (process.env.NODE_ENV !== "production") globalForDatabase.pool = pool;

export function initializeDatabase() {
  if (!globalForDatabase.databaseReady) {
    globalForDatabase.databaseReady = db
      .transaction(async (tx) => {
        // Serialize setup across concurrent server instances.
        await tx.execute(sql`SELECT pg_advisory_xact_lock(72419305)`);
        await tx.execute(sql`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'user',
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);

        await tx.execute(sql`
        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);

        await tx.execute(sql`
        CREATE TABLE IF NOT EXISTS tasks (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          status TEXT NOT NULL DEFAULT 'TODO',
          priority TEXT NOT NULL DEFAULT 'medium',
          deadline DATE,
          position INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);

        await tx.execute(
          sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'medium'`,
        );

        await tx.execute(
          sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS deadline DATE`,
        );

        await tx.execute(sql`
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'tasks'
              AND column_name = 'deadline'
              AND data_type = 'timestamp without time zone'
          ) THEN
            ALTER TABLE tasks ALTER COLUMN deadline TYPE DATE USING deadline::date;
          END IF;
        END $$;
      `);

        await tx.execute(
          sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS position INTEGER NOT NULL DEFAULT 0`,
        );

        await tx.execute(sql`
        CREATE UNIQUE INDEX IF NOT EXISTS tasks_title_idx ON tasks(title)
      `);

        await tx.execute(sql`
        CREATE INDEX IF NOT EXISTS tasks_status_position_idx
        ON tasks(status, position)
      `);

        await tx.execute(sql`
        CREATE TABLE IF NOT EXISTS statuses (
          id SERIAL PRIMARY KEY,
          key TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          position INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);

        await tx.execute(sql`
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

        await tx.execute(sql`
        ALTER TABLE attachments
        ADD COLUMN IF NOT EXISTS storage_provider TEXT NOT NULL DEFAULT 'blob'
      `);

        await tx.execute(sql`
        CREATE INDEX IF NOT EXISTS attachments_task_id_idx
        ON attachments(task_id)
      `);

        await tx.execute(sql`
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

        await tx.execute(sql`
        CREATE INDEX IF NOT EXISTS pending_attachments_expiry_idx
        ON pending_attachments(expires_at)
      `);

        await tx.execute(sql`
        ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignee_id INTEGER
        REFERENCES users(id) ON DELETE SET NULL
      `);
        await tx.execute(
          sql`CREATE INDEX IF NOT EXISTS tasks_assignee_id_idx ON tasks(assignee_id)`,
        );
        await tx.execute(
          sql`CREATE INDEX IF NOT EXISTS tasks_deadline_idx ON tasks(deadline)`,
        );
        await tx.execute(
          sql`CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions(expires_at)`,
        );

        if (env.adminEmail && env.adminPassword) {
          const email = env.adminEmail.trim().toLowerCase();
          const existing = await tx.execute(
            sql`SELECT id FROM users WHERE email = ${email}`,
          );
          if (!existing.rows.length) {
            const { hash } = await import("bcrypt");
            const passwordHash = await hash(
              env.adminPassword,
              env.passwordHashRounds,
            );
            await tx.execute(sql`
            INSERT INTO users (name, email, password_hash, role)
            VALUES (${env.adminName}, ${email}, ${passwordHash}, 'admin')
            ON CONFLICT (email) DO NOTHING
          `);
          }
        }

        const defaults = env.defaultStatuses
          .split(",")
          .map((item, position) => {
            const [key, ...name] = item.split(":");
            return { key: key?.trim(), name: name.join(":").trim(), position };
          });

        const existingStatuses = await tx.execute(
          sql`SELECT id FROM statuses LIMIT 1`,
        );
        const seeds = existingStatuses.rows.length ? [] : defaults;
        for (const status of [
          ...seeds,
          { key: "TODO", name: "To do", position: 0 },
          { key: "COMPLETED", name: "Completed", position: defaults.length },
        ]) {
          if (!status.key || !status.name) continue;
          await tx.execute(sql`
          INSERT INTO statuses (key, name, position)
          VALUES (${status.key}, ${status.name}, ${status.position})
          ON CONFLICT (key) DO NOTHING
        `);
        }
      })
      .catch((error: unknown) => {
        globalForDatabase.databaseReady = undefined;
        throw error;
      });
  }

  return globalForDatabase.databaseReady;
}
