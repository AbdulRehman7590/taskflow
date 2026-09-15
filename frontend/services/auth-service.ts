import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { compare, hash } from "bcrypt";
import { eq } from "drizzle-orm";
import { ApiError } from "@/lib/api-handler";
import { db, initializeDatabase } from "@/lib/db";
import { sessions, users } from "@/lib/db/schema";
import { env } from "@/lib/env";
import type { AuthUser, UserRole } from "@/types";

export const SESSION_COOKIE = env.sessionCookieName;
export const CSRF_COOKIE = env.csrfCookieName;

function publicUser(user: typeof users.$inferSelect): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as UserRole,
  };
}

export async function createSession(userId: number) {
  await initializeDatabase();

  const id = randomBytes(32).toString("hex");
  const csrf = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + env.sessionDays * 86400000);

  await db.insert(sessions).values({ id, userId, expiresAt });

  const jar = await cookies();
  const shared = {
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  };
  jar.set(SESSION_COOKIE, id, { ...shared, httpOnly: true });
  jar.set(CSRF_COOKIE, csrf, { ...shared, httpOnly: false });
}

export async function getSessionUser(): Promise<AuthUser | null> {
  await initializeDatabase();
  const id = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!id) return null;
  const current = (
    await db
      .select({ session: sessions, user: users })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(eq(sessions.id, id))
  )[0];
  if (!current || current.session.expiresAt <= new Date()) {
    if (current) await db.delete(sessions).where(eq(sessions.id, id));
    return null;
  }
  return publicUser(current.user);
}

export async function requireUser(request: Request, role?: UserRole) {
  const user = await getSessionUser();
  if (!user) throw new ApiError("You must be signed in to continue.", 401);
  if (role && user.role !== role)
    throw new ApiError("You are not allowed to perform this action.", 403);
  if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
    const csrf = request.headers.get("x-csrf-token");
    const expected = (await cookies()).get(CSRF_COOKIE)?.value;
    if (!csrf || !expected || csrf !== expected)
      throw new ApiError(
        "Security check failed. Refresh the page and try again.",
        403,
      );
  }
  return user;
}

export async function logout() {
  const id = (await cookies()).get(SESSION_COOKIE)?.value;
  if (id) await db.delete(sessions).where(eq(sessions.id, id));
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  jar.delete(CSRF_COOKIE);
}

export async function registerUser(
  name: string,
  email: string,
  password: string,
) {
  await initializeDatabase();
  if (password.length < 8)
    throw new ApiError("Password must be at least 8 characters.", 400);
  const normalized = email.trim().toLowerCase();
  if (
    (
      await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, normalized))
    )[0]
  )
    throw new ApiError("An account with this email already exists.", 409);
  const user = (
    await db
      .insert(users)
      .values({
        name: name.trim(),
        email: normalized,
        passwordHash: await hash(password, env.passwordHashRounds),
        role: "user",
      })
      .returning()
  )[0];
  await createSession(user.id);
  return publicUser(user);
}

export async function loginUser(email: string, password: string) {
  await initializeDatabase();
  const user = (
    await db
      .select()
      .from(users)
      .where(eq(users.email, email.trim().toLowerCase()))
  )[0];
  if (!user || !(await compare(password, user.passwordHash)))
    throw new ApiError("Email or password is incorrect.", 401);
  await createSession(user.id);
  return publicUser(user);
}

export async function listUsers() {
  await initializeDatabase();
  const result = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(users.createdAt);
  return result.map((user) => ({ ...user, role: user.role as UserRole }));
}

export async function updateUserRole(
  id: number,
  role: UserRole,
  actorId: number,
) {
  await initializeDatabase();
  if (id === actorId)
    throw new ApiError("You cannot change your own role.", 403);
  if (role === "admin")
    throw new ApiError("Users cannot be promoted to admin.", 403);
  const target = (await db.select().from(users).where(eq(users.id, id)))[0];
  if (!target) return null;
  if (target.role === "admin")
    throw new ApiError("Admin roles cannot be changed.", 403);
  return (
    await db.update(users).set({ role }).where(eq(users.id, id)).returning()
  )[0];
}
