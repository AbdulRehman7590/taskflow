import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { unstable_cache } from "next/cache";
import { randomBytes } from "node:crypto";
import { compare, hash } from "bcrypt";
import { eq } from "drizzle-orm";
import { ApiError } from "@/lib/api-handler";
import { CACHE_TAGS } from "@/lib/cache";
import { db, initializeDatabase } from "@/lib/db";
import { sessions, users } from "@/lib/db/schema";
import { ROUTES, env } from "@/lib/env";
import type { AssignableUserRole, AuthUser, UserRole } from "@/types";

const MUTATING_METHODS = ["POST", "PUT", "PATCH", "DELETE"];

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
  jar.set(env.sessionCookieName, id, { ...shared, httpOnly: true });
  jar.set(env.csrfCookieName, csrf, { ...shared, httpOnly: false });
}

export async function resolveSessionUser(
  sessionId: string | undefined,
): Promise<AuthUser | null> {
  if (!sessionId) return null;
  await initializeDatabase();

  const current = (
    await db
      .select({ session: sessions, user: users })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(eq(sessions.id, sessionId))
  )[0];

  if (!current) return null;
  if (current.session.expiresAt <= new Date()) {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
    return null;
  }
  return publicUser(current.user);
}

export const getSessionUser = cache(async (): Promise<AuthUser | null> => {
  const sessionId = (await cookies()).get(env.sessionCookieName)?.value;
  return resolveSessionUser(sessionId);
});

export async function requirePageUser(role?: UserRole) {
  const user = await getSessionUser();
  if (!user) redirect(ROUTES.login);
  if (role && user.role !== role) redirect(ROUTES.home);
  return user;
}

export async function redirectAuthenticatedUser() {
  if (await getSessionUser()) redirect(ROUTES.home);
}

export async function requireUser(request: Request, role?: UserRole) {
  const user = await getSessionUser();
  if (!user) throw new ApiError("You must be signed in to continue.", 401);
  if (role && user.role !== role)
    throw new ApiError("You are not allowed to perform this action.", 403);

  if (MUTATING_METHODS.includes(request.method)) {
    const sent = request.headers.get("x-csrf-token");
    const expected = (await cookies()).get(env.csrfCookieName)?.value;
    if (!sent || !expected || sent !== expected)
      throw new ApiError(
        "Security check failed. Refresh the page and try again.",
        403,
      );
  }
  return user;
}

export async function requireActionUser(role?: UserRole) {
  const user = await getSessionUser();
  if (!user) throw new ApiError("You must be signed in to continue.", 401);
  if (role && user.role !== role)
    throw new ApiError("You are not allowed to perform this action.", 403);
  return user;
}

export async function logout() {
  const jar = await cookies();
  const id = jar.get(env.sessionCookieName)?.value;
  
  if (id) await db.delete(sessions).where(eq(sessions.id, id));
  jar.delete(env.sessionCookieName);
  jar.delete(env.csrfCookieName);
}

export async function registerUser(
  name: string,
  email: string,
  password: string,
) {
  await initializeDatabase();

  const existing = (
    await db.select({ id: users.id }).from(users).where(eq(users.email, email))
  )[0];
  if (existing)
    throw new ApiError("An account with this email already exists.", 409);

  const user = (
    await db
      .insert(users)
      .values({
        name,
        email,
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

  const user = (await db.select().from(users).where(eq(users.email, email)))[0];
  if (!user || !(await compare(password, user.passwordHash)))
    throw new ApiError("Email or password is incorrect.", 401);

  await createSession(user.id);
  return publicUser(user);
}

async function readUsers() {
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
  return result.map((user) => ({
    ...user,
    role: user.role as UserRole,
    createdAt: user.createdAt.toISOString(),
  }));
}

export const listUsers = unstable_cache(readUsers, ["workspace-team"], {
  revalidate: 300,
  tags: [CACHE_TAGS.team],
});

export async function updateUserRole(userId: number, role: AssignableUserRole) {
  await initializeDatabase();

  const target = (await db.select().from(users).where(eq(users.id, userId)))[0];
  if (!target) throw new ApiError("User not found.", 404);

  if (target.role === "admin") {
    throw new ApiError("Administrator roles cannot be changed here.", 403);
  }

  const updated = (
    await db.update(users).set({ role }).where(eq(users.id, userId)).returning()
  )[0];

  return publicUser(updated);
}
