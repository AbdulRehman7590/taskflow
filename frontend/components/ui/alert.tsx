import * as React from "react";
import { cn } from "@/lib/utils";
export function Alert({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="alert"
      className={cn("relative w-full rounded-lg border p-4 text-sm", className)}
      {...props}
    />
  );
}
