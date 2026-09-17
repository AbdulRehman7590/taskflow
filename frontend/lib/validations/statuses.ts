import { z } from "zod";

export const statusSchema = z.object({
  name: z.string().trim().min(2, "Status name must be at least 2 characters."),
});

export const statusOrderSchema = z.object({
  statusIds: z.array(
    z
      .number()
      .int("Status IDs must be integers.")
      .positive("Status IDs must be positive."),
  ),
});

export type StatusInput = z.infer<typeof statusSchema>;
export type StatusOrderInput = z.infer<typeof statusOrderSchema>;
