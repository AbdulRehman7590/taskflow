import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import type { Feedback, Task } from "@/types";

export const feedbackAtom = atom<Feedback | null>(null);

export const taskDialogAtom = atom<{ open: boolean; task: Task | null }>({
  open: false,
  task: null,
});

export const taskDetailAtom = atom<Task | null>(null);

export const statusDialogOpenAtom = atom(false);

export const sidebarCollapsedAtom = atomWithStorage(
  "taskflow-sidebar-collapsed",
  false,
);
