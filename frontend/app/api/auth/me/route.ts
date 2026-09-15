import { NextResponse, type NextRequest } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import { getSessionUser } from "@/services";

export const GET = withApiHandler("GET /api/auth/me", async (_request: NextRequest) => {
  const user = await getSessionUser();
  return user
    ? NextResponse.json({ user })
    : NextResponse.json({ message: "Not signed in." }, { status: 401 });
});
