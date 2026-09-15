import { NextRequest, NextResponse } from "next/server";
import { readJson, withApiHandler } from "@/lib/api-handler";
import { requireUser, listUsers, updateUserRole } from "@/services";
import type { UserRole } from "@/types";

export const GET = withApiHandler("GET /api/team/users", async (request) => {
  await requireUser(request, "admin");
  return NextResponse.json(await listUsers());
});

export const PATCH = withApiHandler("PATCH /api/team/users", async (request) => {
    const actor = await requireUser(request, "admin");
    const body = await readJson(request);
    if (!Number.isInteger(body.id) || (body.role !== "user" && body.role !== "admin"))
      return NextResponse.json(
        { message: "A valid user and role are required." },
        { status: 400 },
      );

    const user = await updateUserRole(
      body.id as number,
      body.role as UserRole,
      actor.id,
    );
    return user
      ? NextResponse.json({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        })
      : NextResponse.json({ message: "User not found." }, { status: 404 });
});
