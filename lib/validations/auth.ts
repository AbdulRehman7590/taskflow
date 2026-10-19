import { z } from "zod";

const email = z
  .string()
  .trim()
  .min(1, "Email is required.")
  .email("Please enter a valid email.")
  .max(254, "Email must be 254 characters or fewer.")
  .toLowerCase();

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required.").max(256),
});

export const signupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(80),
  email,
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .refine(
      (value) => new TextEncoder().encode(value).length <= 72,
      "Password must be 72 bytes or fewer.",
    ),
});

export const authFormSchema = (mode: "login" | "signup") =>
  mode === "signup"
    ? signupSchema
    : loginSchema.extend({ name: z.string().optional() });

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type AuthFormInput = {
  name?: string;
  email: string;
  password: string;
};
