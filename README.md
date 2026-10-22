# Taskgrid

A collaborative Kanban task-management app built with React, TypeScript, Express, Sequelize, and MariaDB/MySQL. Create workspaces, organize tasks, and collaborate with role-based permissions.

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
| Database & ORM | MariaDB / MySQL, Sequelize 6, Sequelize CLI |
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
│   ├── config/            # Sequelize CLI database configuration
│   ├── migrations/        # Sequelize migration files
│   └── src/
│       ├── config/        # Environment and database setup
│       ├── controllers/   # API handlers
│       ├── middlewares/   # Authentication, access control, uploads
│       ├── models/        # Sequelize models and associations
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

Or use the Sequelize CLI helper:
```powershell
npm --prefix backend run db:create
```

### 2. Configure and start the backend

```powershell
cd backend
npm install
```

Copy `backend/.env.example` to `backend/.env` and set a unique random `JWT_SECRET` of at least 32 characters and the database connection:

```env
PORT=5000
DATABASE_URL="mysql://kanban:replace-with-a-strong-password@localhost:3306/minikanban"
JWT_SECRET="replace-with-a-long-random-secret"
CORS_ORIGIN="http://localhost:5373"
```

Sequelize and Sequelize CLI read `DATABASE_URL` from `backend/.env`. If the database password contains URL-reserved characters, URL-encode them in `DATABASE_URL`.

`TRUST_PROXY_HOPS` defaults to `0` (no proxy headers trusted). If the backend is only reachable through one trusted reverse proxy, set it to `1` so rate limiting uses the client IP forwarded by that proxy. Set the value to the actual number of trusted proxy hops in your hosting setup; do not trust forwarded headers if clients can connect directly to the Node process.

Apply migrations and start the API:

```powershell
npm run db:migrate
npm run dev
```

The API runs at `http://localhost:5000`.

The public diagnostic endpoint is `GET /api/health` (also available at
`GET /api/health/full`). It checks database connectivity, verifies that the
`User` table exists, and reports the configured CORS origin and whether the
request's `Origin` matches it. It does not return credentials or raw database
errors. A `503` response means the database is unreachable or its migrations
have not initialized the schema.

### Database Migrations with Sequelize CLI

Manage database migrations easily using the CLI scripts in `backend`:

- **Run pending migrations:** `npm run db:migrate` (or `npx sequelize-cli db:migrate`)
- **Roll back last migration:** `npm run db:migrate:undo` (or `npx sequelize-cli db:migrate:undo`)
- **Roll back all migrations:** `npm run db:migrate:undo:all` (or `npx sequelize-cli db:migrate:undo:all`)
- **Check migration status:** `npm run db:migrate:status` (or `npx sequelize-cli db:migrate:status`)
- **Generate new migration:** `npm run migration:generate -- --name migration-name` (or `npx sequelize-cli migration:generate --name migration-name`)

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

Compose starts MariaDB, applies Sequelize migrations when the backend container starts, and serves the frontend and API at:

- Frontend: `http://localhost:5173`
- API: `http://localhost:5000`
- MariaDB: `localhost:3306`

Compose provides local-development-only defaults for the database user and passwords. Override `DB_NAME`, `DB_USER`, `DB_PASSWORD`, and `DB_ROOT_PASSWORD` in the environment before starting it. Change the development JWT secret in `docker-compose.yml` before using this configuration beyond local development. Never use development defaults in production.

## Builds

```powershell
npm --prefix backend run build
npm --prefix frontend run build
```

See [ROADMAP.md](./ROADMAP.md) for proposed product and engineering improvements.
