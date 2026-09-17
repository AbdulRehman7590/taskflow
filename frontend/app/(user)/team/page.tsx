import { TeamUsers } from "@/components/team-users";
import { listUsers, requirePageUser } from "@/services";

export default async function TeamPage() {
  const user = await requirePageUser();
  const users = await listUsers();

  return (
    <TeamUsers
      currentUserId={user.id}
      users={users}
      canManageRoles={user.role === "admin"}
    />
  );
}
