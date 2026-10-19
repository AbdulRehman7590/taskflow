import type { TaskPriority } from "@/lib/validations";

export type Status = {
  id: number;
  key: string;
  name: string;
  position: number;
  createdAt: string;
};

export type Attachment = {
  id: number;
  taskId: number;
  fileName: string;
  mimeType: string;
  size: number;
  pathname: string;
  url: string;
  storageProvider: "blob" | "local";
  createdAt: string;
};

export type StagedAttachment = {
  token: string;
  fileName: string;
  mimeType: string;
  size: number;
  previewUrl: string;
};

export type Task = {
  id: number;
  title: string;
  description: string | null;
  status: string;
  priority: TaskPriority;
  deadline: string | null;
  assigneeId: number | null;
  position: number;
  createdAt: string;
  updatedAt: string;
  attachments: Attachment[];
};

export type TaskStats = {
  total: number;
  byStatus: Record<string, number>;
  overdue: number;
  dueToday: number;
  highPriority: number;
};

export type TaskPage = {
  items: Task[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  stats: TaskStats;
};

export type {
  StatusInput,
  StatusOrderInput,
  TaskFormInput,
  TaskInput,
  TaskListQuery,
  TaskListView,
  TaskOrderInput,
  TaskPriority,
  CreateTaskInput,
} from "@/lib/validations";
