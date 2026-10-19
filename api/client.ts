import { clientEnv } from "@/lib/client-env";
import type { ApiMessage } from "@/types";

function csrfToken() {
  if (typeof document === "undefined") return "";
  return (
    document.cookie
      .split("; ")
      .find((entry) => entry.startsWith(`${clientEnv.csrfCookieName}=`))
      ?.split("=")[1] ?? ""
  );
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const isMutation = Boolean(options.method && options.method !== "GET");
  const isFormData = options.body instanceof FormData;

  let response: Response;
  try {
    response = await fetch(`${clientEnv.apiBaseUrl}${path}`, {
      ...options,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(isMutation ? { "x-csrf-token": csrfToken() } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      "We could not reach the server. Check your connection and try again.",
    );
  }

  const body = (await response.json().catch(() => null)) as
    (T & Partial<ApiMessage>) | null;

  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") {
      window.location.assign("/login");
    }
    throw new Error(body?.message ?? "We couldn't complete that request.");
  }
  return body as T;
}
