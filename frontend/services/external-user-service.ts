import { z } from "zod";
import { ApiError } from "@/lib/api-handler";
import { CACHE_TAGS } from "@/lib/cache";
import { env } from "@/lib/env";
import type { ExternalUserQuery } from "@/lib/validations";
import type { ExternalUser, ExternalUserPage } from "@/types";

const responseSchema = z.object({
  users: z.array(
    z.object({
      id: z.number(),
      firstName: z.string(),
      lastName: z.string(),
      username: z.string(),
      email: z.string(),
      phone: z.string(),
      image: z.string(),
      age: z.number(),
      address: z.object({
        city: z.string(),
        state: z.string(),
        country: z.string(),
      }),
      company: z.object({
        department: z.string(),
        name: z.string(),
        title: z.string(),
      }),
    }),
  ),
  total: z.number(),
});

const sortFields: Record<ExternalUserQuery["sort"], string> = {
  name: "firstName",
  username: "username",
  email: "email",
  age: "age",
};

function buildUrl(query: ExternalUserQuery) {
  const base = env.dummyJsonBaseUrl.replace(/\/+$/, "");
  const url = new URL(`${base}/users${query.q ? "/search" : ""}`);

  if (query.q) url.searchParams.set("q", query.q);
  url.searchParams.set("limit", String(query.pageSize));
  url.searchParams.set("skip", String((query.page - 1) * query.pageSize));
  url.searchParams.set("sortBy", sortFields[query.sort]);
  url.searchParams.set("order", query.order);
  return url;
}

function toExternalUser(
  user: z.infer<typeof responseSchema>["users"][number],
): ExternalUser {
  return {
    id: user.id,
    name: [user.firstName, user.lastName].filter(Boolean).join(" "),
    username: user.username,
    email: user.email,
    phone: user.phone,
    image: user.image,
    age: user.age,
    company: user.company.name,
    jobTitle: user.company.title,
    department: user.company.department,
    location: [user.address.city, user.address.state, user.address.country]
      .filter(Boolean)
      .join(", "),
  };
}

export const externalUserService = {
  async list(query: ExternalUserQuery): Promise<ExternalUserPage> {
    const response = await fetch(buildUrl(query), {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(env.externalUsersTimeoutMs),
      next: { revalidate: 300, tags: [CACHE_TAGS.externalUsers] },
    }).catch(() => {
      throw new ApiError(
        "The directory service is unavailable right now.",
        502,
      );
    });

    if (!response.ok) {
      throw new ApiError(
        "The directory service is unavailable right now.",
        502,
      );
    }

    const parsed = responseSchema.safeParse(await response.json());
    if (!parsed.success) {
      throw new ApiError(
        "The directory service returned unexpected data.",
        502,
      );
    }

    return {
      items: parsed.data.users.map(toExternalUser),
      page: query.page,
      pageSize: query.pageSize,
      total: parsed.data.total,
      totalPages: Math.max(1, Math.ceil(parsed.data.total / query.pageSize)),
    };
  },
};
