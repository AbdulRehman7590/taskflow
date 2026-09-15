import { NextResponse, type NextRequest } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import { logout } from "@/services";

export const POST = withApiHandler("POST /api/auth/logout", async (_request: NextRequest) => {
  await logout();
  return NextResponse.json({ message: "You have been signed out." });
});
