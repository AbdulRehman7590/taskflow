import type { Status, StatusInput, Task, TaskInput } from "@/types/task";

const API_URL = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...options?.headers },
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.message ?? "We couldn't complete that request.");
    }
    return response.json();
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        "The task service is unavailable. Please start the API and try again.",
      );
    }
    throw error;
  }
}

export const taskApi = {
  list: () => request<Task[]>("/tasks"),

  create: (input: TaskInput) =>
    request<Task>("/tasks", { method: "POST", body: JSON.stringify(input) }),

  update: (id: number, input: Partial<TaskInput>) =>
    request<Task>(`/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),

  remove: (id: number) =>
    request<{ message: string }>(`/tasks/${id}`, { method: "DELETE" }),

  listStatuses: () => request<Status[]>("/tasks/statuses"),

  createStatus: (input: StatusInput) =>
    request<Status>("/tasks/statuses", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  updateStatus: (id: number, input: StatusInput) =>
    request<Status>(`/tasks/statuses/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),

  deleteStatus: (id: number) =>
    request<{ message: string }>(`/tasks/statuses/${id}`, { method: "DELETE" }),

  reorderStatuses: (statusIds: number[]) =>
    request<Status[]>("/tasks/statuses/order", {
      method: "PATCH",
      body: JSON.stringify({ statusIds }),
    }),
};
