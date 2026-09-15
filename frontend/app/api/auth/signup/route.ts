import { NextRequest, NextResponse } from "next/server";
import { readJson, withApiHandler } from "@/lib/api-handler";
import { registerUser } from "@/services";

export const POST = withApiHandler("POST /api/auth/signup", async (request) => {
    const body = await readJson(request);

    if (typeof body.name !== "string" || body.name.trim().length < 2)
      return NextResponse.json(
        { message: "Please enter your name." },
        { status: 400 },
      );

    if (typeof body.email !== "string" || !body.email.includes("@"))
      return NextResponse.json(
        { message: "Please enter a valid email." },
        { status: 400 },
      );

    if (typeof body.password !== "string")
      return NextResponse.json(
        { message: "Please enter a password." },
        { status: 400 },
      );

    return NextResponse.json(
      { user: await registerUser(body.name, body.email, body.password) },
      { status: 201 },
    );
});
