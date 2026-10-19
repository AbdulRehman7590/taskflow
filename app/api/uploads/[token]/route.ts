import { NextResponse } from "next/server";
import { ApiError, withApiHandler } from "@/lib/api-handler";
import { attachmentService, requireUser } from "@/services";

type Context = { params: Promise<{ token: string }> };

export const DELETE = withApiHandler<Context>(
  "DELETE /api/uploads/:token",
  async (request, context) => {
    const user = await requireUser(request, "admin");
    const { token } = await context.params;
    if (!/^[0-9a-f-]{36}$/i.test(token)) {
      throw new ApiError("Invalid upload token.", 400);
    }
    await attachmentService.discard([token], user.id);
    return NextResponse.json({ message: "Staged upload removed." });
  },
);
