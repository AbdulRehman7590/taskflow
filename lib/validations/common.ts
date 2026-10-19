import { z } from "zod";

export const userRoleSchema = z.enum(["admin", "user"]);

export const optionalText = (max = 100, message?: string) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() ? value : undefined),
    z.string().trim().max(max, message).optional(),
  );

export const pageSizeSchema = <const T extends readonly number[]>(sizes: T) =>
  z.coerce
    .number()
    .int()
    .catch(sizes[0])
    .transform((value) => (sizes.includes(value) ? value : sizes[0]));

export type UserRole = z.infer<typeof userRoleSchema>;
