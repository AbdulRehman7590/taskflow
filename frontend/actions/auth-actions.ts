"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { actionResult, parseInput } from "@/lib/api-handler";
import { revalidateTeam } from "@/lib/cache";
import { ROUTES } from "@/lib/env";
import {
  loginSchema,
  signupSchema,
  userRoleUpdateSchema,
} from "@/lib/validations";
import {
  loginUser,
  logout,
  registerUser,
  requireActionUser,
  updateUserRole,
} from "@/services";
import type { ActionResult, AuthUser } from "@/types";

export async function loginAction(
  input: unknown,
): Promise<ActionResult<AuthUser>> {
  return actionResult(async () => {
    const { email, password } = parseInput(loginSchema, input);
    const user = await loginUser(email, password);
    revalidatePath("/", "layout");
    return user;
  });
}

export async function signupAction(
  input: unknown,
): Promise<ActionResult<AuthUser>> {
  return actionResult(async () => {
    const { name, email, password } = parseInput(signupSchema, input);
    const user = await registerUser(name, email, password);
    revalidateTeam();
    revalidatePath("/", "layout");
    return user;
  });
}

export async function updateUserRoleAction(
  input: unknown,
): Promise<ActionResult<AuthUser>> {
  return actionResult(async () => {
    await requireActionUser("admin");
    const { userId, role } = parseInput(userRoleUpdateSchema, input);
    const user = await updateUserRole(userId, role);
    revalidateTeam();
    return user;
  });
}

export async function logoutAction() {
  await logout();
  revalidatePath("/", "layout");
  redirect(ROUTES.login);
}
