# Full-Stack Mini Kanban Board Application

A production-grade, collaborative Mini Kanban Board web application built with **React**, **TypeScript**, **Tailwind CSS**, **Node.js**, **Express**, **Prisma ORM**, and **PostgreSQL**.

Designed following modern design specifications with dark/light theme support, drag-and-drop task management (`@dnd-kit`), role-based access control (RBAC), and persistent ordering.

---

## 🚀 Features

- **Authentication & Security**
  - User registration & login with JWT authentication.
  - Password hashing using `bcryptjs`.
  - Protected API routes and client-side page guards.

- **Board & Collaboration Management**
  - Create, update, and delete Kanban boards.
  - Share boards with registered users.
  - Role-Based Access Control (RBAC):
    - **Owner**: Full administrative control over board, columns, tasks, and members.
    - **Editor**: Can manage columns, tasks, and task movements.
    - **Viewer**: Read-only access to view boards and tasks.

- **Kanban Board & Drag-and-Drop**
  - Create, edit, and delete columns.
  - Dynamic drag-and-drop powered by `@dnd-kit`.
  - Reorder tasks within the same column.
  - Move tasks across columns.
  - Persistent ordering saved directly to PostgreSQL.

- **Task Features**
  - Rich task details: Title, Description, Priority (LOW, MEDIUM, HIGH, URGENT), Due Date, Assigned User.
  - Visual badges for priority and status.
  - Modal dialogs for task creation and editing.

- **Modern UI / UX (Design System)**
  - Dark and Light mode toggle.
  - Custom Tailwind design system tokens.
  - Responsive sidebar and navigation shell.
  - Loading skeletons, empty states, and toast notifications.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 + TypeScript (Vite)
- **Styling**: Tailwind CSS + `clsx` + `tailwind-merge`
- **Routing**: React Router v7
- **Data Fetching & State**: TanStack Query (React Query v5) + Axios
- **Drag & Drop**: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- **Icons**: Lucide React (`lucide-react`)

### Backend
- **Runtime & Framework**: Node.js + Express.js + TypeScript
- **Database ORM**: Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: JSON Web Tokens (`jsonwebtoken`)
- **Validation**: Zod schema validation
- **Password Security**: `bcryptjs`

### DevOps & Containerization
- Docker & Docker Compose

---

## 📁 Repository Structure

```text
mini_kanban/
├── frontend/             # React + Vite + Tailwind CSS app
│   ├── src/
│   │   ├── components/   # UI & Kanban components
│   │   ├── context/      # Auth & Theme context providers
│   │   ├── hooks/        # Custom React & React Query hooks
│   │   ├── lib/          # Axios instance & utility functions
│   │   ├── pages/        # Application views (Dashboard, Board, Auth)
│   │   └── types/        # TypeScript interfaces & types
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.ts
│   └── vite.config.ts
├── backend/              # Node.js + Express + Prisma API
│   ├── prisma/           # Database schema & seed files
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   │   ├── controllers/  # Route handlers (Auth, Board, Column, Task, Member)
│   │   ├── middlewares/  # Auth & Board access validation middlewares
│   │   ├── routes/       # API router endpoints
│   │   ├── schemas/      # Zod validation schemas
│   │   └── server.ts     # Express application entrypoint
│   ├── package.json
│   └── tsconfig.json
├── docker-compose.yml    # Docker setup for Postgres, Backend & Frontend
├── design_react.md       # Design system specification
├── README.md             # Project documentation
└── .gitignore
```

---

## 🚦 Getting Started (Local Development)

### Prerequisites
- Node.js (v18 or higher)
- npm or pnpm or yarn
- PostgreSQL instance running locally (or via Docker)

### 1. Database & Backend Setup

1. Navigate to the backend folder:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in `backend/`:
   ```env
   PORT=5000
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/minikanban?schema=public"
   JWT_SECRET="super-secret-jwt-key-kanban-2026"
   CORS_ORIGIN="http://localhost:5173"
   ```

4. Run Prisma database migrations & seed test data:
   ```bash
   npx prisma migrate dev --name init
   npx prisma db seed
   ```

5. Start the backend development server:
   ```bash
   npm run dev
   ```
   The backend runs on `http://localhost:5000`.

---

### 2. Frontend Setup

1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in `frontend/`:
   ```env
   VITE_API_BASE_URL="http://localhost:5000/api"
   ```

4. Start the frontend Vite server:
   ```bash
   npm run dev
   ```
   The frontend runs on `http://localhost:5173`.

---

## 🐳 Docker Setup

To run the entire full-stack application with PostgreSQL using Docker Compose:

```bash
docker-compose up --build
```

Access the frontend at `http://localhost:5173` and the API at `http://localhost:5000`.

---

## 🧪 Default Test Credentials (from Seed)

- **Email**: `alex@example.com` | **Password**: `password123` (Board Owner)
- **Email**: `sam@example.com`  | **Password**: `password123` (Board Editor)
- **Email**: `taylor@example.com` | **Password**: `password123` (Board Viewer)

---

## 📜 License

This project is open-source under the MIT License.
