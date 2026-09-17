function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is missing. Add it to frontend/.env.`);
  return value;
}

function positiveInteger(name: string, fallback: number) {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isInteger(value) || value < 1)
    throw new Error(`${name} must be a positive integer.`);
  return value;
}

export const env = {
  databaseUrl: required("DATABASE_URL"),
  sessionCookieName: process.env.SESSION_COOKIE_NAME ?? "taskflow_session",
  csrfCookieName: process.env.CSRF_COOKIE_NAME ?? "taskflow_csrf",
  sessionDays: positiveInteger("SESSION_DAYS", 2),
  passwordHashRounds: positiveInteger("PASSWORD_HASH_ROUNDS", 12),
  adminName: process.env.ADMIN_NAME ?? "Admin",
  adminEmail: process.env.ADMIN_EMAIL,
  adminPassword: process.env.ADMIN_PASSWORD,
  defaultStatuses:
    process.env.DEFAULT_STATUSES ??
    "TODO:To do,IN_PROGRESS:In progress,COMPLETED:Completed",
  blobReadWriteToken: process.env.BLOB_READ_WRITE_TOKEN,
  localUploadDirectory: process.env.LOCAL_UPLOAD_DIRECTORY ?? ".uploads",
  pendingUploadMinutes: positiveInteger("PENDING_UPLOAD_MINUTES", 30),
  dummyJsonBaseUrl: process.env.DUMMYJSON_BASE_URL ?? "https://dummyjson.com",
  externalUsersTimeoutMs: positiveInteger("EXTERNAL_USERS_TIMEOUT_MS", 8000),
};

export const ROUTES = {
  home: "/",
  login: "/login",
  signup: "/signup",
} as const;

export function blobToken() {
  if (!env.blobReadWriteToken) {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN is missing. Add it to frontend/.env.",
    );
  }
  return { token: env.blobReadWriteToken };
}
