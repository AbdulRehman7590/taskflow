import { NextResponse } from "next/server";
import { ApiError, withApiHandler } from "@/lib/api-handler";
import { attachmentService, requireUser } from "@/services";

type Context = { params: Promise<{ pathname: string }> };

export const GET = withApiHandler<Context>(
  "GET /api/files/:pathname",
  async (request, context) => {
    const user = await requireUser(request);
    const { pathname } = await context.params;
    if (!/^[0-9a-f-]{36}$/i.test(pathname)) {
      throw new ApiError("File not found.", 404);
    }
    const file = await attachmentService.readLocal(pathname, user.id);
    if (!file?.bytes) throw new ApiError("File not found.", 404);
    return new NextResponse(new Uint8Array(file.bytes), {
      headers: {
        "Content-Type": file.mimeType,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  },
);
