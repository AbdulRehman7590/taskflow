import { NextResponse, type NextRequest } from "next/server";
import { withApiHandler } from "@/lib/api-handler";

export const GET = withApiHandler("GET /api/health", async (_request: NextRequest) => {
  return NextResponse.json({ status: "ok", message: "Task API is running" });
});
