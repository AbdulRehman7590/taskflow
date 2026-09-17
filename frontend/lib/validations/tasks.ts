import { z } from "zod";
import { optionalText, pageSizeSchema } from "./common";

export const TASK_PAGE_SIZES = [12, 24, 48] as const;
export const TASK_PRIORITIES = ["low", "medium", "high"] as const;
export const taskPrioritySchema = z.enum(TASK_PRIORITIES);

const statusKey = z.string().trim().min(1, "Task status is required.");
const deadline = z.preprocess(
  (value) => (typeof value === "string" && value.trim() ? value : undefined),
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid deadline.")
    .optional(),
);

export const taskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required.")
    .max(120, "Title must be 120 characters or fewer."),
  description: z
    .string()
    .trim()
    .max(2000, "Description must be 2000 characters or fewer.")
    .optional(),
  status: statusKey.optional(),
  priority: taskPrioritySchema.default("medium"),
  deadline,
});

export const taskFormSchema = taskSchema.extend({ status: statusKey });
export const createTaskSchema = taskSchema.omit({ status: true }).extend({
  stagedAttachmentTokens: z.array(z.string().uuid()).max(10).default([]),
});

export const taskStatusSchema = z.object({ status: statusKey });

export const taskOrderSchema = z.object({
  status: statusKey,
  orderedIds: z.array(z.number().int().positive()).min(1),
});

export const taskListQuerySchema = z.object({
  q: optionalText().default(""),
  priority: z
    .enum(["ALL", ...TASK_PRIORITIES])
    .catch("ALL")
    .default("ALL"),
  sort: z
    .enum(["position", "createdAt", "updatedAt", "priority", "deadline"])
    .catch("position")
    .default("position"),
  deadline: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .or(z.literal(""))
    .catch("")
    .default(""),
  page: z.coerce.number().int().min(1).catch(1).default(1),
  pageSize: pageSizeSchema(TASK_PAGE_SIZES),
  view: z.enum(["board", "table"]).catch("board").default("board"),
});

export function isManualBoardOrder(query: TaskListQuery) {
  return (
    query.view === "board" &&
    query.sort === "position" &&
    !query.q &&
    query.priority === "ALL" &&
    !query.deadline
  );
}

export type TaskInput = z.infer<typeof taskSchema>;
export type TaskFormInput = z.infer<typeof taskFormSchema>;
export type TaskFormRawInput = z.input<typeof taskFormSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type TaskOrderInput = z.infer<typeof taskOrderSchema>;
export type TaskPriority = z.infer<typeof taskPrioritySchema>;
export type TaskListQuery = z.infer<typeof taskListQuerySchema>;
export type TaskListView = TaskListQuery["view"];
