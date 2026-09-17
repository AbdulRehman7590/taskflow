export const clientEnv = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api",
  csrfCookieName: process.env.NEXT_PUBLIC_CSRF_COOKIE_NAME ?? "taskflow_csrf",
};
