import { clientEnv } from "@/lib/client-env";
import type { ApiMessage } from "@/types";

type ApiRequestOptions = RequestInit & {
  redirectOnUnauthorized?: boolean;
};

function csrfToken() {
  if (typeof document === "undefined") return undefined;
  return document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${clientEnv.csrfCookieName}=`))
    ?.split("=")[1];
}

export async function apiRequest<T>(
  path: string,
  options?: ApiRequestOptions,
): Promise<T> {
  try {
    const { redirectOnUnauthorized = true, ...requestOptions } = options ?? {};
    const response = await fetch(`${clientEnv.apiBaseUrl}${path}`, {
      ...requestOptions,
      headers: {
        "Content-Type": "application/json",
        ...(requestOptions.method && requestOptions.method !== "GET"
          ? { "x-csrf-token": csrfToken() ?? "" }
          : {}),
        ...requestOptions.headers,
      },
    });

    const body = (await response.json().catch(() => null)) as
      | T
      | ApiMessage
      | null;

    if (!response.ok) {
      if (
        redirectOnUnauthorized &&
        response.status === 401 &&
        typeof window !== "undefined"
      )
        window.location.assign("/logout");
      throw new Error(
        (body as ApiMessage | null)?.message ??
          "We couldn't complete that request.",
      );
    }
    return body as T;
  } catch (error) {
    if (error instanceof TypeError)
      throw new Error(
        "The task service is unavailable. Please start the API and try again.",
      );
    throw error;
  }
}
