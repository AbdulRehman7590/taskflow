import { apiRequest } from "./client";
import type { AuthUser, TeamUser, UserRole } from "@/types";

export const teamApi = {
  list: () => apiRequest<TeamUser[]>("/team/users"),

  updateRole: (id: number, role: UserRole) =>
    apiRequest<TeamUser>(`/team/users`, {
      method: "PATCH",
      body: JSON.stringify({ id, role }),
    }),
};
