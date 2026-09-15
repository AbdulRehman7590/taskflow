import { NextResponse, type NextRequest } from "next/server";

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status = 500, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function publicError(error: {
  status?: number;
  code?: string;
  message?: string;
}) {
  if (error.status && error.status < 500)
    return error.message ?? "Please check the information and try again.";
  if (error.code === "23505")
    return "That status name is already in use. Please choose a different name.";
  if (error.code === "42P01")
    return "The task workspace is not ready yet. Please try again in a moment.";
  return "Something went wrong on our side. Please try again in a moment.";
}

export function getId(value: string) {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1)
    throw new ApiError("Task id must be a positive integer", 400);
  return id;
}

export function validateTaskInput(body: Record<string, unknown>) {
  if (
    body.title !== undefined &&
    (typeof body.title !== "string" || !body.title.trim())
  ) {
    throw new ApiError("Title is required", 400);
  }
  if (body.description !== undefined && typeof body.description !== "string") {
    throw new ApiError("Description must be text", 400);
  }
  if (
    body.status !== undefined &&
    (typeof body.status !== "string" || !body.status.trim())
  ) {
    throw new ApiError("Task status is required", 400);
  }
}

export function validateStatusInput(body: Record<string, unknown>) {
  if (typeof body.name !== "string" || body.name.trim().length < 2) {
    throw new ApiError("Status name must be at least two characters", 400);
  }
}

export async function readJson(
  request: Request,
): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    if (!body || Array.isArray(body) || typeof body !== "object")
      throw new ApiError("Request body must be a JSON object.", 400);
    return body as Record<string, unknown>;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("Request body must contain valid JSON.", 400);
  }
}

export function errorResponse(error: unknown, route: string) {
  const cause = (error as { cause?: { code?: string } }).cause;
  const value = error as { code?: string };
  const code = value.code ?? cause?.code;
  console.error(route, error);
  return NextResponse.json(
    { message: publicError({ ...value, code }) },
    { status: value instanceof ApiError ? value.status : 500 },
  );
}

export function withApiHandler<TContext>(
  route: string,
  handler: (request: NextRequest, context: TContext) => Promise<NextResponse>,
) {
  return async (request: NextRequest, context: TContext) => {
    try {
      return await handler(request, context);
    } catch (error) {
      return errorResponse(error, route);
    }
  };
}
