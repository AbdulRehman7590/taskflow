import { atom } from "jotai";
import type { Task } from "@/types";

export const editingTaskAtom = atom<Task | null>(null);
export const isTaskFormOpenAtom = atom(false);
export const isLoadingTasksAtom = atom(false);
export const taskErrorAtom = atom<string | null>(null);
export const taskFilterAtom = atom<string | "ALL">("ALL");
