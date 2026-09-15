import { atom } from "jotai";
import type { Status, Task } from "@/types/task";

export const tasksAtom = atom<Task[]>([]);
export const statusesAtom = atom<Status[]>([]);
export const editingTaskAtom = atom<Task | null>(null);
export const isTaskFormOpenAtom = atom(false);
export const isLoadingTasksAtom = atom(false);
export const taskErrorAtom = atom<string | null>(null);
export const taskFilterAtom = atom<string | "ALL">("ALL");

export const taskCountsAtom = atom((get) => {
  const tasks = get(tasksAtom);
  return { ALL: tasks.length };
});
