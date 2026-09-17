import {
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: text("role").notNull().default("user"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({ emailIndex: uniqueIndex("users_email_idx").on(table.email) }),
);

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const statuses = pgTable(
  "statuses",
  {
    id: serial("id").primaryKey(),
    key: text("key").notNull(),
    name: text("name").notNull(),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    keyIndex: uniqueIndex("statuses_key_idx").on(table.key),
  }),
);

export const tasks = pgTable(
  "tasks",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status").notNull().default("TODO"),
    priority: text("priority").notNull().default("medium"),
    deadline: timestamp("deadline"),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    titleIndex: uniqueIndex("tasks_title_idx").on(table.title),
    statusPositionIndex: index("tasks_status_position_idx").on(
      table.status,
      table.position,
    ),
  }),
);

export const attachments = pgTable(
  "attachments",
  {
    id: serial("id").primaryKey(),
    taskId: integer("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    fileName: text("file_name").notNull(),
    mimeType: text("mime_type").notNull(),
    size: integer("size").notNull(),
    pathname: text("pathname").notNull(),
    url: text("url").notNull(),
    storageProvider: text("storage_provider").notNull().default("blob"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    taskIndex: index("attachments_task_id_idx").on(table.taskId),
  }),
);

export const pendingAttachments = pgTable(
  "pending_attachments",
  {
    token: text("token").primaryKey(),
    uploadedBy: integer("uploaded_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    fileName: text("file_name").notNull(),
    mimeType: text("mime_type").notNull(),
    size: integer("size").notNull(),
    pathname: text("pathname").notNull(),
    url: text("url").notNull(),
    storageProvider: text("storage_provider").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    expiryIndex: index("pending_attachments_expiry_idx").on(table.expiresAt),
  }),
);
