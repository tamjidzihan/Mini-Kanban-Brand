# Taskgrid

A collaborative Kanban task-management app built with React, TypeScript, Express, Prisma, and MariaDB. Create workspaces, organize tasks, and collaborate with role-based permissions.

## Features

- Register and sign in with JWT authentication.
- Create and manage workspaces and workflow columns.
- Drag and drop tasks between columns, with ordering persisted to the database.
- Share workspaces with **Owner**, **Editor**, and **Viewer** roles.
- Track task descriptions, priority, due dates, assignees, subtasks, comments, and activity.
- Switch between Kanban, list, calendar, and analytics views.
- Write and preview Markdown in workspace descriptions.
- Upload JPEG, PNG, or WebP profile images up to 5 MB, or provide an image URL.
- Use responsive layouts and light, dark, or system theme preferences.

## Tech stack

| Area | Technologies |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, React Router 6 |
| Data and drag-and-drop | TanStack Query, Axios, `@dnd-kit` |
| Markdown | `react-markdown`, `remark-gfm` |
| Backend | Node.js, Express, TypeScript, Zod |
| Database | MariaDB 11.4, Prisma 6.19 |
| Authentication | JWT, bcryptjs |
| Local orchestration | Docker Compose |

## Repository layout

```text
mini_kanban/
├── frontend/
│   └── src/
│       ├── components/    # Kanban, layout, auth, and shared UI
│       ├── context/       # Auth, theme, and toast providers
│       ├── hooks/         # Shared React hooks
│       ├── lib/           # API client and utilities
│       └── pages/         # Dashboard, board, auth, and profile screens
├── backend/
│   ├── prisma/            # MariaDB schema and migrations
│   └── src/
│       ├── config/        # Environment and database setup
│       ├── controllers/   # API handlers
│       ├── middlewares/   # Authentication, access control, uploads
│       ├── routes/        # REST API routes
│       └── schemas/       # Zod request validation
├── docker-compose.yml
├── ROADMAP.md
└── README.md
```

## Run locally

### Requirements

- Node.js 20.19+, 22.12+, or 24+ and npm
- MariaDB 11.4 or a compatible MySQL server

### 1. Create a MariaDB database and user

Connect to MariaDB as an administrator and run SQL like the following, changing the password to a strong local value:

```sql
CREATE DATABASE minikanban CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'kanban'@'localhost' IDENTIFIED BY 'replace-with-a-strong-password';
GRANT ALL PRIVILEGES ON minikanban.* TO 'kanban'@'localhost';
```

### 2. Configure and start the backend

```powershell
cd backend
npm install
```

Copy `backend/.env.example` to `backend/.env` and set a unique random `JWT_SECRET` of at least 32 characters and the database user's password:

```env
PORT=5000
DATABASE_URL="mysql://kanban:replace-with-a-strong-password@localhost:3306/minikanban"
JWT_SECRET="replace-with-a-long-random-secret"
CORS_ORIGIN="http://localhost:5373"
```

Prisma reads `DATABASE_URL` from `backend/.env` using the datasource setting in `prisma/schema.prisma`. The generated client uses Prisma 6's `engineType = "client"` with the MariaDB driver adapter, so the app-local generated client does not depend on a platform-specific query-engine binary. Generate it with `npm run prisma:generate`; `npm run build` runs generation automatically before compiling. If the database password contains URL-reserved characters, URL-encode them in `DATABASE_URL`.

`TRUST_PROXY_HOPS` defaults to `0` (no proxy headers trusted). If the backend is only reachable through one trusted reverse proxy, set it to `1` so rate limiting uses the client IP forwarded by that proxy. Set the value to the actual number of trusted proxy hops in your hosting setup; do not trust forwarded headers if clients can connect directly to the Node process.

Apply the checked-in migrations and start the API:

```powershell
npx prisma migrate dev
npm run dev
```

The API runs at `http://localhost:5000`.

The public diagnostic endpoint is `GET /api/health` (also available at
`GET /api/health/full`). It checks database connectivity, verifies that the
`User` table exists, and reports the configured CORS origin and whether the
request's `Origin` matches it. It does not return credentials or raw database
errors. A `503` response means the database is unreachable or its migrations
have not initialized the schema.

### 3. Start the frontend

In another terminal:

```powershell
cd frontend
npm install
```

Optionally copy `frontend/.env.example` to `frontend/.env` to set the API URL:

```env
VITE_API_BASE_URL="http://localhost:5000/api"
```

Start Vite:

```powershell
npm run dev
```

The development frontend runs at `http://localhost:5373`.

## Run with Docker Compose

From the repository root:

```powershell
docker compose up --build
```

Compose starts MariaDB, applies Prisma migrations when the backend container starts, and serves the frontend and API at:

- Frontend: `http://localhost:5173`
- API: `http://localhost:5000`
- MariaDB: `localhost:3306`

Compose provides local-development-only defaults for the database user and passwords. Override `DB_NAME`, `DB_USER`, `DB_PASSWORD`, and `DB_ROOT_PASSWORD` in the environment before starting it. Change the development JWT secret in `docker-compose.yml` before using this configuration beyond local development. Never use development defaults in production.

## Database and uploaded images

The Prisma schema and MariaDB migration are in `backend/prisma/`. For an already-running deployment, use `npx prisma migrate deploy` to apply pending migrations; use `npx prisma migrate dev` for local schema development.

This project now targets MariaDB. Existing PostgreSQL data is not automatically copied, migrated, or deleted. Plan and verify a separate data migration before switching any deployment that contains data.

Uploaded profile images are stored in `backend/uploads/` during local development and in the `avatar_uploads` Docker volume under Compose. Back up image storage as well as the database.

### Deploying the backend on cPanel

Build locally from the backend directory before uploading:

```powershell
cd backend
npm ci
npm run build
```

Upload the application files to the cPanel Node.js Application Root, including
`dist/`, `generated/`, `prisma/`, `package.json`, and `package-lock.json`. Then
install the production dependencies using cPanel's
Node.js application interface and restart the app. The generated Prisma Client
is stored in `generated/prisma/` and imported from the application, rather than
being expected under cPanel's separate Node virtual environment. This project
uses Prisma 6.19 so the datasource URL remains in the Prisma schema; ensure
the cPanel application environment contains `DATABASE_URL` for runtime, and
provide it in the shell environment when generating or applying migrations.

Set `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `TRUST_PROXY_HOPS=1`, and
`NODE_ENV=production` in the cPanel application environment when Passenger
forwards requests through one trusted proxy. The hop count must match the
actual trusted proxy chain, and the Node process should not be directly
reachable by untrusted clients.

The error `The table User does not exist` means migrations have not been
applied to the database selected by `DATABASE_URL`, or the app is connected to
the wrong database. After verifying the cPanel `DATABASE_URL` matches the
runtime setting, have the host run these commands from the application root:

```sh
npx prisma migrate status
npm run prisma:deploy
```

If cPanel has no Terminal, database migration is still possible if the database
accepts remote connections from your computer or a CI runner: run the Prisma 6
CLI from the backend project with `DATABASE_URL` set to the cPanel database URL.
For PowerShell, from the repository root after installing backend dependencies:

```powershell
$env:DATABASE_URL = "mysql://CPANEL_DB_USER:URL_ENCODED_PASSWORD@DB_HOST:3306/CPANEL_DB_NAME"
npm --prefix backend run prisma:deploy
Remove-Item Env:DATABASE_URL
```

First inspect the migrations and back up the target database. Restrict remote
database access to your IP where possible and use a database user limited to
the application database. If remote access is disabled, ask the provider to
enable it temporarily or run `npx prisma migrate deploy` from the application
root. Do not manually create the `User` table in phpMyAdmin; Prisma migration
history must also be applied correctly. Do not add a public HTTP endpoint that
runs migrations; it would expose a database-changing operation to the internet.

Back up the database and inspect pending migrations before applying them.
Pending migrations in this project remove the old time-tracking and
Labels & Tags data/tables, so do not deploy them to a database containing data
you need to preserve.

The app does not ship with demo accounts or sample records. Register an account and create a workspace to get started.

## Builds

```powershell
npm --prefix backend test
npm --prefix frontend run build
npm --prefix backend run build
Push-Location backend; npx prisma validate; Pop-Location
```

See [ROADMAP.md](./ROADMAP.md) for proposed product and engineering improvements.
