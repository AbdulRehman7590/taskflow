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
  adminName: process.env.ADMIN_NAME ?? "Admin",
  adminEmail: process.env.ADMIN_EMAIL,
  adminPassword: process.env.ADMIN_PASSWORD,
  sessionCookieName: process.env.SESSION_COOKIE_NAME ?? "taskflow_session",
  csrfCookieName: process.env.CSRF_COOKIE_NAME ?? "taskflow_csrf",
  sessionDays: positiveInteger("SESSION_DAYS", 2),
  passwordHashRounds: positiveInteger("PASSWORD_HASH_ROUNDS", 12),
  defaultStatuses:
    process.env.DEFAULT_STATUSES ??
    "TODO:To do,IN_PROGRESS:In progress,COMPLETED:Completed",
};
