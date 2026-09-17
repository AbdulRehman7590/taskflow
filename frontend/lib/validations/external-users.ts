import { z } from "zod";
import { optionalText, pageSizeSchema } from "./common";

export const DIRECTORY_PAGE_SIZES = [12, 24, 48] as const;

export const externalUserQuerySchema = z.object({
  q: optionalText(100, "Search must be 100 characters or fewer.").default(""),
  page: z.coerce.number().int().min(1).catch(1).default(1),
  pageSize: pageSizeSchema(DIRECTORY_PAGE_SIZES),
  sort: z
    .enum(["name", "username", "email", "age"])
    .catch("name")
    .default("name"),
  order: z.enum(["asc", "desc"]).catch("asc").default("asc"),
});

export type ExternalUserQuery = z.infer<typeof externalUserQuerySchema>;
