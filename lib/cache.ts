import { revalidatePath, revalidateTag } from "next/cache";

export const CACHE_TAGS = {
  statuses: "task-statuses",
  externalUsers: "external-users",
  team: "workspace-team",
} as const;

export function revalidateTasks() {
  revalidatePath("/");
}

export function revalidateTeam() {
  revalidateTag(CACHE_TAGS.team, { expire: 0 });
  revalidatePath("/team");
}

export function revalidateStatuses() {
  revalidateTag(CACHE_TAGS.statuses, { expire: 0 });
  revalidatePath("/");
}
