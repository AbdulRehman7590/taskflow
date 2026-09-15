export type Status = {
  id: number;
  key: string;
  name: string;
  position: number;
  createdAt: string;
};

export type TaskStatus = string;

export type Task = {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
};

export type TaskInput = {
  title: string;
  description?: string;
  status?: TaskStatus;
};

export type StatusInput = { name: string };
