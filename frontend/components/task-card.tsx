"use client";

import { GripVertical, Pencil, Trash2 } from "lucide-react";
import type { Status, Task } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export type TaskCardProps = {
  task: Task;
  statuses: Status[];
  onEdit: () => void;
  onDelete: () => void;
  onDragStart: () => void;
  canEdit: boolean;
};

export default function TaskCard({
  task,
  statuses,
  onEdit,
  onDelete,
  onDragStart,
  canEdit,
}: TaskCardProps) {
  const status = statuses.find((item) => item.key === task.status);

  return (
    <Card
      draggable
      onDragStart={onDragStart}
      className="group cursor-grab rounded-2xl border-border/80 transition duration-200 hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-lg active:cursor-grabbing"
    >
      <CardContent className="p-4">
      <div className="flex items-start gap-3">
        <GripVertical
          className="mt-0.5 shrink-0 text-muted-foreground/40"
          size={18}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-bold leading-5">{task.title}</h3>
            {canEdit && (
              <div className="flex shrink-0 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                <button
                  onClick={onEdit}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                  aria-label={`Edit ${task.title}`}
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={onDelete}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  aria-label={`Delete ${task.title}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>
          {task.description && (
            <p className="mt-2 line-clamp-3 text-sm leading-5 text-muted-foreground">
              {task.description}
            </p>
          )}
          <div className="mt-4">
            <Badge variant="secondary" className="bg-sky-500/10 text-sky-700 dark:text-sky-300">
              {status?.name ?? task.status}
            </Badge>
          </div>
        </div>
      </div>
      </CardContent>
    </Card>
  );
}
