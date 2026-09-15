import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const globalForDatabase = globalThis as unknown as {
  pool?: Pool;
  databaseReady?: Promise<void>;
};

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing. Add it to frontend/.env.");
}

export const pool =
  globalForDatabase.pool ??
  new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

if (process.env.NODE_ENV !== "production") globalForDatabase.pool = pool;

export function initializeDatabase() {
  if (!globalForDatabase.databaseReady) {
    globalForDatabase.databaseReady = (async () => {
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
      await db.execute(sql`
        INSERT INTO statuses (key, name, position)
        VALUES ('TODO', 'To do', 0), ('IN_PROGRESS', 'In progress', 1), ('COMPLETED', 'Completed', 2)
        ON CONFLICT (key) DO NOTHING
      `);
    })();
  }
  return globalForDatabase.databaseReady;
}
