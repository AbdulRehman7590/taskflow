"use client";

import { useEffect, useState } from "react";
import TaskManager from "@/components/task-manager";

export default function TaskManagerShell() {
  const [ready, setReady] = useState(false);

  useEffect(() => setReady(true), []);

  return ready ? <TaskManager /> : null;
}
