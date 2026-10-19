import { z } from "zod";

export const statusSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Status name must be at least 2 characters.")
    .max(60),
});

export const statusOrderSchema = z.object({
  statusIds: z
    .array(
      z
        .number()
        .int("Status IDs must be integers.")
        .positive("Status IDs must be positive."),
    )
    .min(1)
    .max(100)
    .refine(
      (ids) => new Set(ids).size === ids.length,
      "Status IDs must be unique.",
    ),
});

export type StatusInput = z.infer<typeof statusSchema>;
export type StatusOrderInput = z.infer<typeof statusOrderSchema>;
