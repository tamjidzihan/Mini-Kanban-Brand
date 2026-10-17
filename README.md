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
| Database | MariaDB 11.4, Prisma 7 |
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

Prisma reads `DATABASE_URL` from `backend/.env` through `prisma.config.ts` for migrations. The application uses that same setting to configure Prisma's MariaDB driver adapter. If the database password contains URL-reserved characters, URL-encode them in `DATABASE_URL`.

Apply the checked-in migrations and start the API:

```powershell
npx prisma migrate dev
npm run dev
```

The API runs at `http://localhost:5000`.

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

The app does not ship with demo accounts or sample records. Register an account and create a workspace to get started.

## Builds

```powershell
npm --prefix backend test
npm --prefix frontend run build
npm --prefix backend run build
Push-Location backend; npx prisma validate; Pop-Location
```

See [ROADMAP.md](./ROADMAP.md) for proposed product and engineering improvements.
