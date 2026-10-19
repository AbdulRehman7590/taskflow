# Taskflow

A team task management workspace built with Next.js, TypeScript, React, and PostgreSQL. Organize shared work on a Kanban board or in a searchable table, assign owners, manage deadlines, upload supporting files, and follow progress through customizable workflow stages.

## Features

- Drag and drop tasks between statuses; reorder board cards and workflow stages.
- Create, edit, assign, search, filter, paginate, and export tasks as spreadsheet-safe CSV.
- Track task priority, UTC calendar deadlines, overdue items, attachments, and completion statistics.
- View task details and change their status from the task board or table, including on mobile.
- Let teammates register themselves, review workspace membership, and assign work to any member.
- Protect administrator actions with role checks, secure password hashing, expiring sessions, HTTP-only session cookies, and CSRF tokens.
- Browse and search a cached, paginated directory backed by the [DummyJSON Users API](https://dummyjson.com/docs/users).
- Store local uploads during development or configure Vercel Blob for deployed environments.
- Provision PostgreSQL tables automatically and safely the first time the application connects.

## Requirements

- Node.js 22 or later.
- npm 10 or later.
- Docker Desktop with Docker Compose, or a running PostgreSQL 12+ database.
- A current PostgreSQL release is recommended for deployment. The included development container uses PostgreSQL 17.

## Start locally with Docker

1. Create the local configuration file and edit its administrator and database passwords:

   ```bash
   cp .env.example .env
   ```

   On PowerShell, use `Copy-Item .env.example .env`.

   Make sure the database name and credentials in `DATABASE_URL` match `POSTGRES_DB`, `POSTGRES_USER`, and `POSTGRES_PASSWORD`.

2. Start PostgreSQL:

   ```bash
   docker compose up -d db
   ```

3. Install the locked dependencies and start the application:

   ```bash
   npm ci
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) and sign in with `ADMIN_EMAIL` and `ADMIN_PASSWORD` from your local `.env` file.

To stop the local database while keeping its data, run `docker compose down`. To discard the database and all local data, run `docker compose down --volumes`.

## Connect an existing PostgreSQL database

Copy `.env.example` to `.env`, set `DATABASE_URL` to your PostgreSQL connection string, configure the initial administrator credentials, and run `npm ci` followed by `npm run dev`.

The first database connection creates the application tables, their indexes, and the configured initial statuses. You do not need to run a separate schema setup command. An advisory transaction lock prevents concurrent application instances from racing during setup. Existing tasks, status order, user accounts, and administrator passwords are preserved on subsequent starts.

Administrator seed settings create the administrator account only when that email is absent. They never reset an existing account's password. After the first administrator has signed in, remove `ADMIN_EMAIL` and `ADMIN_PASSWORD` from the deployment environment. Registrations create regular team member accounts.

## Configuration

All configuration is read from the project root's `.env` file. Keep this file private; it is ignored by Git. `.env.example` lists every supported setting.

| Setting                                                              | Required                         | Description                                                                                                  |
| -------------------------------------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `DATABASE_URL`                                                       | Yes                              | PostgreSQL connection string.                                                                                |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`                                      | Only for the first administrator | Credentials used to seed an administrator if the email does not already exist.                               |
| `ADMIN_NAME`                                                         | No                               | Name shown for the seeded administrator. Defaults to `Admin`.                                                |
| `SESSION_DAYS`                                                       | No                               | Session lifetime in days. Defaults to `2`.                                                                   |
| `PASSWORD_HASH_ROUNDS`                                               | No                               | bcrypt work factor. Defaults to `12`.                                                                        |
| `SESSION_COOKIE_NAME`                                                | No                               | HTTP-only sign-in cookie name. Defaults to `taskflow_session`.                                               |
| `CSRF_COOKIE_NAME`, `NEXT_PUBLIC_CSRF_COOKIE_NAME`                   | No                               | CSRF cookie names. If changed, configure both to the same value.                                             |
| `DEFAULT_STATUSES`                                                   | No                               | Comma-separated `KEY:Display name` stages for a new database. Defaults to To do, In progress, and Completed. |
| `NEXT_PUBLIC_API_BASE_URL`                                           | No                               | Same-origin API prefix. Defaults to `/api`.                                                                  |
| `BLOB_READ_WRITE_TOKEN`                                              | No                               | Vercel Blob token. Required for durable file storage in production.                                          |
| `LOCAL_UPLOAD_DIRECTORY`                                             | No                               | Local development upload directory. Defaults to `.uploads`.                                                  |
| `PENDING_UPLOAD_MINUTES`                                             | No                               | Lifetime of files awaiting task creation. Defaults to `30`.                                                  |
| `DUMMYJSON_BASE_URL`                                                 | No                               | User directory API base URL. Defaults to `https://dummyjson.com`.                                            |
| `EXTERNAL_USERS_TIMEOUT_MS`                                          | No                               | Timeout for the external directory request. Defaults to `8000`.                                              |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT` | Local Docker only                | Credentials, database name, and port used by `docker compose up -d db`. Keep the connection string in sync.  |

An empty `BLOB_READ_WRITE_TOKEN` selects local file storage in development. Production deliberately fails uploads until a durable blob storage token is configured. Local filesystem uploads are suitable for development and local use; they are not durable on ephemeral hosting.

Task deadlines are calendar dates stored as PostgreSQL `DATE` values, so server time zones cannot shift a due date. Existing timestamp-based deadlines are converted to calendar dates during startup while preserving the dates already stored in the database.

## Commands

| Command                | Purpose                                            |
| ---------------------- | -------------------------------------------------- |
| `npm run dev`          | Start the local development server.                |
| `npm run typecheck`    | Check TypeScript without generating output.        |
| `npm run format`       | Format the source and documentation with Prettier. |
| `npm run format:check` | Check formatting without changing files.           |
| `npm run check`        | Run the TypeScript and formatting checks.          |
| `npm run build`        | Create an optimized production build.              |
| `npm run start`        | Serve a production build.                          |

## Access and routes

| Route               | Access                                                                           |
| ------------------- | -------------------------------------------------------------------------------- |
| `/login`, `/signup` | Public. Registrations join as team members.                                      |
| `/`                 | Any signed-in workspace member. Administrators manage tasks and workflow stages. |
| `/team`             | Any signed-in workspace member.                                                  |
| `/directory`        | Administrator only.                                                              |
| `/api/health`       | Public service health endpoint.                                                  |
| `/api/tasks/export` | Signed-in members; exports every task matching the current filters.              |

Members can move tasks between workflow stages and review team members. Administrators can create, edit, assign, reorder, and delete tasks; manage statuses; and add or delete attachments. All server pages, server actions, and API handlers perform their own authorization checks.

## File uploads

Task attachments are limited to 10 MB each and 10 files per task creation. Supported files include JPEG, PNG, GIF, WebP, PDF, plain text, CSV, Word, and Excel documents.

In development, files are written to `.uploads`; the directory is created automatically when needed. For production, configure `BLOB_READ_WRITE_TOKEN` using your deployment host's secret manager and persist the configured Vercel Blob files. Do not commit environment files or storage tokens.

## API

Task and workflow endpoints use `/api/tasks` and `/api/tasks/statuses`. Mutations require a signed-in administrator where applicable and are protected with a CSRF header. The client application reads that header from the CSRF cookie automatically. The task CSV endpoint uses the same search, status, assignee, priority, date, and sort filters as the dashboard.

All API and server action inputs are validated before use. API errors return a safe message and, where applicable, per-field validation errors.

## Project structure

```text
actions/       Validated server actions
api/           Typed browser API client
app/           App Router pages, API routes, layouts, and styles
atoms/         Small pieces of shared interface state
components/    Dashboard, task, authentication, and UI components
lib/           Database setup, environment, validation, and helpers
public/        Static assets
services/      Authentication, task, directory, and file-storage logic
types/         Shared application types
```

## Production deployment

Use a persistent, managed PostgreSQL database; configure `DATABASE_URL` and `BLOB_READ_WRITE_TOKEN` as deployment secrets; set secure administrator bootstrap credentials for first-time setup; and remove those credentials once the administrator account exists. Provide a valid absolute application URL for any hosting-specific integration. Deploy using `npm ci`, `npm run build`, and `npm run start`, or your hosting platform's equivalent Next.js build and start commands.

Serve the app over HTTPS so its production authentication cookies receive the `Secure` flag. Back up PostgreSQL and your blob storage using the respective provider's supported backup process.

## License

No license has been specified for this repository.
