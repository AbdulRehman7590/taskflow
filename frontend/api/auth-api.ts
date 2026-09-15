import { apiRequest } from "./client";
import type {
  ApiMessage,
  ApiUserResponse,
  LoginInput,
  SignupInput,
} from "@/types";

export const authApi = {
  login: (input: LoginInput) =>
    apiRequest<ApiUserResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
      redirectOnUnauthorized: false,
    }),

  signup: (input: SignupInput) =>
    apiRequest<ApiUserResponse>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(input),
      redirectOnUnauthorized: false,
    }),

  me: () => apiRequest<ApiUserResponse>("/auth/me", { redirectOnUnauthorized: false }),

  logout: () => apiRequest<ApiMessage>("/auth/logout", { method: "POST", redirectOnUnauthorized: false }),
};
