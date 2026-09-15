import { redirect } from "next/navigation";
import { getSessionUser, listUsers } from "@/services";
import TeamUsers from "@/components/team-users";

export default async function TeamPage() {
  const user = await getSessionUser();

  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/");

  const users = await listUsers();
  return (
    <TeamUsers
      currentUserId={user.id}
      initialUsers={users.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
      }))}
    />
  );
}
