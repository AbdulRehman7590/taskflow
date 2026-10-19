import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import type { ActionResult, FieldErrors } from "@/types";

export class ApiError extends Error {
  status: number;
  fieldErrors?: FieldErrors;

  constructor(message: string, status = 500, fieldErrors?: FieldErrors) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

function errorStatus(error: unknown) {
  if (error instanceof ApiError) return error.status;
  if ((error as { code?: string } | null)?.code === "23505") return 409;
  return 500;
}

function publicMessage(error: unknown) {
  if (error instanceof ApiError && error.status < 500) return error.message;

  const code = (error as { code?: string })?.code;
  if (code === "23505")
    return "That name is already in use. Please choose a different one.";
  if (code === "42P01")
    return "The workspace is not ready yet. Please try again in a moment.";
  return "Something went wrong on our side. Please try again in a moment.";
}

function fieldErrorsFrom(error: z.ZodError): FieldErrors {
  const fieldErrors: FieldErrors = {};

  for (const issue of error.issues) {
    const field = issue.path.join(".") || "form";
    (fieldErrors[field] ??= []).push(issue.message);
  }

  return fieldErrors;
}

function validationError(error: z.ZodError) {
  return new ApiError(
    error.issues[0]?.message ?? "Please check the information and try again.",
    400,
    fieldErrorsFrom(error),
  );
}

export function getId(value: string, label = "id") {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1)
    throw new ApiError(`The ${label} must be a positive integer.`, 400);
  return id;
}

export function parseInput<TSchema extends z.ZodType>(
  schema: TSchema,
  input: unknown,
): z.output<TSchema> {
  const result = schema.safeParse(input);
  if (!result.success) throw validationError(result.error);
  return result.data;
}

export async function parseJson<TSchema extends z.ZodType>(
  request: Request,
  schema: TSchema,
): Promise<z.output<TSchema>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new ApiError("Request body must contain valid JSON.", 400);
  }
  return parseInput(schema, body);
}

export function withApiHandler<TContext = unknown>(
  route: string,
  handler: (request: NextRequest, context: TContext) => Promise<NextResponse>,
) {
  return async (request: NextRequest, context: TContext) => {
    try {
      return await handler(request, context);
    } catch (error) {
      const status = errorStatus(error);
      if (status >= 500) console.error(route, error);

      return NextResponse.json(
        {
          message: publicMessage(error),
          ...(error instanceof ApiError && error.fieldErrors
            ? { fieldErrors: error.fieldErrors }
            : {}),
        },
        { status },
      );
    }
  };
}

export async function actionResult<T>(
  run: () => Promise<T>,
): Promise<ActionResult<T>> {
  try {
    return { success: true, data: await run() };
  } catch (error) {
    const status = errorStatus(error);
    if (status >= 500) console.error("Server Action failed", error);

    return {
      success: false,
      error: publicMessage(error),
      ...(error instanceof ApiError && error.fieldErrors
        ? { fieldErrors: error.fieldErrors }
        : {}),
    };
  }
}
