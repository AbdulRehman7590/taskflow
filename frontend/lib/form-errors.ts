import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import type { FieldErrors } from "@/types";

export function applyServerErrors<TValues extends FieldValues>(
  setError: UseFormSetError<TValues>,
  fields: readonly Path<TValues>[],
  failure: { error: string; fieldErrors?: FieldErrors },
) {
  for (const field of fields) {
    const message = failure.fieldErrors?.[field as string]?.[0];
    if (message) setError(field, { type: "server", message });
  }
  setError("root", { type: "server", message: failure.error });
}
