export type UserRole = "admin" | "user";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
};

export type TeamUser = AuthUser & { createdAt: string };

export type AuthMode = "login" | "signup";

export type LoginInput = { email: string; password: string };
export type SignupInput = LoginInput & { name: string };
