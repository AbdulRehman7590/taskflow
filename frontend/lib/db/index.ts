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
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
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
