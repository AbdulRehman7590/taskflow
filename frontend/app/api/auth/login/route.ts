import { NextRequest, NextResponse } from "next/server";
import { readJson, withApiHandler } from "@/lib/api-handler";
import { loginUser } from "@/services";

export const POST = withApiHandler("POST /api/auth/login", async (request) => {
    const body = await readJson(request);
    if (typeof body.email !== "string" || typeof body.password !== "string")
      return NextResponse.json(
        { message: "Email and password are required." },
        { status: 400 },
      );
    return NextResponse.json({
      user: await loginUser(body.email, body.password),
    });
});
