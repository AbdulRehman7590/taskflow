import { apiRequest } from "./client";
import type {
  ApiMessage,
  Attachment,
  StagedAttachment,
  Status,
  StatusInput,
  Task,
} from "@/types";

export const taskApi = {
  changeStatus: (id: number, status: string) =>
    apiRequest<Task>(`/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  reorderTasks: (status: string, orderedIds: number[]) =>
    apiRequest<ApiMessage>("/tasks/order", {
      method: "PATCH",
      body: JSON.stringify({ status, orderedIds }),
    }),

  remove: (id: number) =>
    apiRequest<ApiMessage>(`/tasks/${id}`, { method: "DELETE" }),

  uploadAttachment: (taskId: number, file: File) => {
    const body = new FormData();
    body.append("file", file);
    return apiRequest<Attachment>(`/tasks/${taskId}/attachments`, {
      method: "POST",
      body,
    });
  },

  stageAttachment: (file: File) => {
    const body = new FormData();
    body.append("file", file);
    return apiRequest<StagedAttachment>("/uploads", {
      method: "POST",
      body,
    });
  },

  discardStagedAttachment: (token: string) =>
    apiRequest<ApiMessage>(`/uploads/${token}`, { method: "DELETE" }),

  deleteAttachment: (taskId: number, attachmentId: number) =>
    apiRequest<ApiMessage>(`/tasks/${taskId}/attachments/${attachmentId}`, {
      method: "DELETE",
    }),

  createStatus: (input: StatusInput) =>
    apiRequest<Status>("/tasks/statuses", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  renameStatus: (id: number, input: StatusInput) =>
    apiRequest<Status>(`/tasks/statuses/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),

  deleteStatus: (id: number) =>
    apiRequest<ApiMessage>(`/tasks/statuses/${id}`, { method: "DELETE" }),

  reorderStatuses: (statusIds: number[]) =>
    apiRequest<Status[]>("/tasks/statuses/order", {
      method: "PATCH",
      body: JSON.stringify({ statusIds }),
    }),
};
