import { z } from "zod";

export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;
export const ALLOWED_ATTACHMENT_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
] as const;

export const attachmentMetadataSchema = z.object({
  fileName: z.string().trim().min(1, "File name is required."),
  mimeType: z
    .string()
    .refine(
      (value) =>
        (ALLOWED_ATTACHMENT_MIME_TYPES as readonly string[]).includes(value),
      "This file type is not supported.",
    ),
  size: z
    .number()
    .int()
    .positive("File cannot be empty.")
    .max(MAX_ATTACHMENT_SIZE, "File must be 10 MB or smaller."),
});

export type AttachmentMetadataInput = z.infer<typeof attachmentMetadataSchema>;
