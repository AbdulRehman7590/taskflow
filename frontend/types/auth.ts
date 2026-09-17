import type { UserRole } from "@/lib/validations";

export type {
  AssignableUserRole,
  LoginInput,
  SignupInput,
  UserRole,
  UserRoleUpdateInput,
} from "@/lib/validations";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
};

export type TeamUser = AuthUser & { createdAt: string };

export type AuthMode = "login" | "signup";
