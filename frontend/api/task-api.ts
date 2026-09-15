import { apiRequest } from "./client";
import type {
  ApiMessage,
  Status,
  StatusInput,
  StatusOrderInput,
  Task,
  TaskInput,
} from "@/types";

export const taskApi = {
  list: () => apiRequest<Task[]>("/tasks"),

  get: (id: number) => apiRequest<Task>(`/tasks/${id}`),

  create: (input: TaskInput) =>
    apiRequest<Task>("/tasks", { method: "POST", body: JSON.stringify(input) }),

  update: (id: number, input: Partial<TaskInput>) =>
    apiRequest<Task>(`/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),

  remove: (id: number) =>
    apiRequest<ApiMessage>(`/tasks/${id}`, { method: "DELETE" }),

  listStatuses: () => apiRequest<Status[]>("/tasks/statuses"),

  createStatus: (input: StatusInput) =>
    apiRequest<Status>("/tasks/statuses", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  updateStatus: (id: number, input: StatusInput) =>
    apiRequest<Status>(`/tasks/statuses/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),

  deleteStatus: (id: number) =>
    apiRequest<ApiMessage>(`/tasks/statuses/${id}`, { method: "DELETE" }),

  reorderStatuses: (statusIds: StatusOrderInput["statusIds"]) =>
    apiRequest<Status[]>("/tasks/statuses/order", {
      method: "PATCH",
      body: JSON.stringify({ statusIds }),
    }),
};
