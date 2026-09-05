# Build a Full-Stack Mini Kanban Board Application

Build a production-quality **Mini Kanban Board** web application with a clean, modern, responsive UI.

## Important Design Instruction

I already have a **preferred UI/UX design/reference**.

Use my provided design as the primary visual reference.

Do NOT invent a completely different design.

Recreate the same:
- Overall layout
- Spacing
- Visual hierarchy
- Card structure
- Sidebar/header structure
- Colors
- Typography style
- Border radius
- Shadows
- Buttons
- Form styling
- Modal/dialog styling
- Kanban board appearance
- Task card appearance
- Responsive behavior

You may improve usability and responsiveness where necessary, but the final application should remain visually consistent with my preferred design.

If a particular UI detail is not present in the reference, use a professional modern SaaS/Project Management design that naturally fits the existing design.

---

# 1. Technology Stack

## Frontend

Use:

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- TanStack Query / React Query
- Axios
- Modern drag-and-drop library such as dnd-kit

Do NOT use Next.js.

## Backend

Use:

- Node.js
- Express.js
- TypeScript
- REST API architecture
- JWT authentication
- bcrypt/argon2 for password hashing
- Zod or equivalent validation

Do NOT use NestJS.

## Database

Use:

- PostgreSQL
- Prisma ORM

## DevOps

Prefer:

- Docker
- Docker Compose

The project must be easy to run locally.

---

# 2. Project Architecture

Create a single repository:

kanban-board/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   └── ...
│
├── backend/
│   ├── src/
│   ├── prisma/
│   ├── package.json
│   ├── tsconfig.json
│   └── ...
│
├── docker-compose.yml
├── README.md
└── .gitignore

Keep frontend and backend completely separated but inside the same repository.

Use clean, scalable folder structures.

---

# 3. Application Goal

Create a functional collaborative Kanban board application where authenticated users can:

- Register
- Login
- Create boards
- View their boards
- Share boards with other registered users
- Create workflow columns
- Create tasks
- Edit tasks
- Delete tasks
- Move tasks between columns
- Reorder tasks inside a column
- Drag and drop tasks
- Manage board members
- Control access permissions

The application must behave like a real project management/Kanban application rather than a static UI demo.

---

# 4. Authentication

Implement secure token-based authentication.

## Registration

Create a registration page containing:

- Full name
- Email
- Password
- Confirm password

Validate all fields.

Passwords must NEVER be stored as plain text.

Hash passwords using bcrypt or Argon2.

## Login

Create a login page:

- Email
- Password
- Remember me if appropriate
- Login button
- Link to registration

Return a JWT after successful authentication.

Protect all private API endpoints using authentication middleware.

## Authentication State

The frontend should:

- Store authentication state securely
- Automatically attach JWT to API requests
- Handle expired/invalid tokens
- Redirect unauthenticated users to login
- Prevent authenticated users from unnecessarily seeing the login page

Create reusable authentication hooks/context.

Example:

useAuth()

---

# 5. Database Design

Design a proper relational PostgreSQL schema using Prisma.

Minimum entities:

## User

Fields:

- id
- name
- email
- passwordHash
- createdAt
- updatedAt

Email must be unique.

## Board

Fields:

- id
- name
- description
- ownerId
- createdAt
- updatedAt

A board belongs to one owner.

## BoardMember

Fields:

- id
- boardId
- userId
- role
- createdAt

Roles:

- OWNER
- EDITOR
- VIEWER

Prevent duplicate memberships.

## Column

Fields:

- id
- boardId
- name
- position
- createdAt
- updatedAt

Each column belongs to exactly one board.

## Task

Fields:

- id
- boardId
- columnId
- title
- description
- position
- createdAt
- updatedAt

Each task must belong to exactly one board and one column.

Make sure boardId and columnId relationships cannot allow a task to accidentally reference resources belonging to another board.

---

# 6. Authorization and Data Isolation

This is extremely important.

Never trust IDs coming from the frontend.

Every protected backend request must verify:

1. The user is authenticated.
2. The requested board exists.
3. The authenticated user has access to that board.
4. The user has sufficient permission for the requested operation.

Example:

A user who has access to:

Board A

must NOT be able to access:

Board B

simply by changing:

/boards/board-b-id

in the URL or request body.

Prevent all forms of:

- Cross-board task access
- Cross-board column access
- Unauthorized board modification
- Unauthorized task modification
- Unauthorized member management

Implement reusable authorization middleware/service functions.

For example:

requireBoardAccess()

requireBoardRole()

---

# 7. Board Management

Create a dashboard where users can see boards they own or have been invited to.

Dashboard should display:

- Board name
- Description
- Owner
- Number of columns
- Number of tasks
- User role
- Last updated
- Open board button

Allow users with appropriate permissions to:

- Create board
- Edit board
- Delete board

Board owners should have full control.

---

# 8. Board Sharing

Implement board collaboration.

The owner/editor should be able to open:

"Manage Members"

and add an existing registered user by email.

Example:

Add member:

user@example.com

Role:

- Editor
- Viewer

Do NOT create accounts automatically.

Only registered users can be added.

Display existing members:

- Name
- Email
- Role
- Remove member
- Change role

Only authorized users should be able to manage members.

---

# 9. Kanban Board UI

Create the main Kanban board page.

Example structure:

┌───────────────────────────────────────────────┐
│ Board Name                  Members   Settings │
├───────────────────────────────────────────────┤
│                                               │
│ TODO          IN PROGRESS        DONE         │
│                                               │
│ ┌─────────┐   ┌────────────┐   ┌─────────┐   │
│ │ Task 1  │   │ Task 3     │   │ Task 5  │   │
│ └─────────┘   └────────────┘   └─────────┘   │
│                                               │
│ ┌─────────┐   ┌────────────┐                 │
│ │ Task 2  │   │ Task 4     │                 │
│ └─────────┘   └────────────┘                 │
│                                               │
└───────────────────────────────────────────────┘

However, the actual visual appearance must follow my provided design.

---

# 10. Drag and Drop

Implement smooth drag-and-drop functionality.

Users should be able to:

### Reorder inside the same column

Example:

Task A
Task B
Task C

Move Task C above Task A:

Task C
Task A
Task B

### Move between columns

Example:

TODO:

Task A
Task B

IN PROGRESS:

Task C

Drag Task B into IN PROGRESS:

TODO:

Task A

IN PROGRESS:

Task C
Task B

The dragged task must be inserted at the exact requested position.

Use a professional drag-and-drop library such as dnd-kit.

Provide good visual feedback while dragging.

---

# 11. Task Ordering

Task ordering must be reliable.

Do NOT rely only on array indexes on the frontend.

The backend must persist the task order.

Every task should have a position/order value.

When moving a task:

- Remove it from the old position.
- Update affected tasks.
- Insert it at the new position.
- Persist the final order.
- Return the updated task/order information.

Handle both:

### Same-column movement

and:

### Cross-column movement

Example API:

PATCH /api/tasks/:taskId/move

Request:

{
  "targetColumnId": "column-id",
  "targetPosition": 2
}

The backend must validate that:

- Task exists
- Target column exists
- Task and target column belong to the same board
- User has permission
- Position is valid

Use a database transaction when updating multiple tasks.

---

# 12. Prevent Ordering Conflicts

The backend must ensure ordering remains consistent.

Avoid duplicate or corrupted positions.

When necessary, normalize/reindex positions.

For example:

0
1
2
3
4

rather than allowing:

0
5
999
999999

After a move, affected tasks should receive consistent ordering.

Use Prisma transactions for atomic updates.

---

# 13. Column Management

Users with EDITOR/OWNER permissions can:

- Create column
- Rename column
- Delete column
- Reorder columns

Example:

To Do
In Progress
Review
Done

Allow adding:

+ Add Column

When deleting a column, do not silently delete tasks.

Provide a confirmation flow.

Possible behavior:

"Move tasks to another column before deleting this column."

---

# 14. Task Management

Users with EDITOR/OWNER permissions can create and edit tasks.

Task should support:

- Title
- Description
- Column
- Position
- Created date
- Updated date

Task modal should include:

- Title input
- Description textarea
- Save
- Cancel
- Delete

Viewer users should be able to view tasks but should not be able to mutate them.

---

# 15. REST API

Create clean REST APIs.

Example:

## Authentication

POST /api/auth/register

POST /api/auth/login

GET /api/auth/me

## Boards

GET /api/boards

POST /api/boards

GET /api/boards/:boardId

PATCH /api/boards/:boardId

DELETE /api/boards/:boardId

## Members

GET /api/boards/:boardId/members

POST /api/boards/:boardId/members

PATCH /api/boards/:boardId/members/:memberId

DELETE /api/boards/:boardId/members/:memberId

## Columns

POST /api/boards/:boardId/columns

PATCH /api/columns/:columnId

DELETE /api/columns/:columnId

PATCH /api/boards/:boardId/columns/reorder

## Tasks

POST /api/columns/:columnId/tasks

PATCH /api/tasks/:taskId

DELETE /api/tasks/:taskId

PATCH /api/tasks/:taskId/move

GET /api/boards/:boardId/tasks

---

# 16. API Response Format

Use consistent response structures.

Success example:

{
  "success": true,
  "data": {}
}

Error example:

{
  "success": false,
  "message": "You do not have permission to modify this board."
}

Use appropriate HTTP status codes:

200
201
400
401
403
404
409
500

Do not expose sensitive database or server errors to users.

---

# 17. Frontend Pages

Create at minimum:

### Login

/login

### Register

/register

### Dashboard

/dashboard

### Board

/boards/:boardId

### Settings

/settings

Use protected routes.

---

# 18. Dashboard UX

The dashboard should feel like a professional SaaS application.

Include:

- Sidebar/navigation
- User profile
- Create board button
- Board cards
- Recent boards
- Shared boards
- Empty state

Board cards should show useful information without becoming cluttered.

Follow my provided design.

---

# 19. Board Header

The board page should contain:

- Board title
- Description
- Back button
- Member avatars
- Add member button
- Board settings
- Add column button

Example:

← Boards

Project Management

[Members] [Settings] [+ Add Column]

Again, follow my provided design instead of blindly using this exact layout.

---

# 20. Loading States

Implement proper loading states.

Do NOT show blank screens.

Use:

- Skeleton loaders
- Button loading states
- Board loading states
- Task loading states

---

# 21. Error Handling

Handle:

- Network failures
- Authentication errors
- Unauthorized access
- Board not found
- Task not found
- Validation errors
- Duplicate member
- Duplicate email
- Server errors

Show user-friendly toast notifications.

Never expose raw backend errors.

---

# 22. Optimistic UI

For drag-and-drop task movement, implement optimistic UI where appropriate.

The board should feel fast.

When the user moves a task:

1. Update UI immediately.
2. Send API request.
3. If successful, keep the new state.
4. If failed, rollback to the previous state and show an error.

Make sure optimistic updates do not cause ordering corruption.

---

# 23. Responsive Design

The application must work properly on:

- Desktop
- Laptop
- Tablet
- Mobile

The Kanban board should support horizontal scrolling on smaller screens.

Do NOT shrink columns until they become unusable.

Cards must remain readable and easy to interact with.

Touch interactions should be considered for mobile drag-and-drop.

---

# 24. UI Quality

The UI should feel like a polished modern SaaS product.

Focus on:

- Consistent spacing
- Clear typography
- Good contrast
- Clean cards
- Smooth transitions
- Hover states
- Focus states
- Accessible buttons
- Accessible forms
- Clear empty states
- Confirmation dialogs for destructive actions

Avoid:

- Excessive gradients
- Excessive animations
- Huge buttons
- Cluttered dashboards
- Unnecessary UI elements
- Random colors
- Inconsistent spacing

Use the provided design as the visual source of truth.

---

# 25. Security

Implement:

- Password hashing
- JWT authentication
- Protected routes
- Authorization middleware
- Input validation
- SQL injection protection through Prisma
- CORS configuration
- Secure error handling
- No password exposure
- No sensitive information in API responses

Never trust boardId, columnId, taskId, or userId supplied by the client.

Always verify relationships server-side.

---

# 26. Prisma

Create:

prisma/schema.prisma

Include proper:

- Relations
- Indexes
- Unique constraints
- Cascade/restrict behavior where appropriate

Create migrations.

Provide seed data for development.

Seed example:

Users:
- demo@example.com
- alice@example.com
- bob@example.com

Boards:
- Product Development
- Marketing

Columns:
- To Do
- In Progress
- Review
- Done

Tasks:
- Example tasks demonstrating ordering and movement.

Use a documented demo password rather than hardcoding a production password.

---

# 27. Environment Variables

Create:

backend/.env.example

Example:

DATABASE_URL="postgresql://postgres:postgres@localhost:5432/kanban_db"

JWT_SECRET="change-this-secret"

PORT=5000

FRONTEND_URL="http://localhost:5173"

Create:

frontend/.env.example

Example:

VITE_API_URL="http://localhost:5000/api"

Never commit real secrets.

---

# 28. Docker

Create:

docker-compose.yml

Services:

- postgres
- backend
- frontend

PostgreSQL should have a persistent volume.

Example architecture:

frontend → backend → postgres

The application should be startable with:

docker compose up --build

Document all required commands.

---

# 29. README

Create a professional README.md.

Include:

# Mini Kanban Board

## Features

## Tech Stack

## Project Structure

## Requirements

## Local Installation

### 1. Clone repository

### 2. Install dependencies

### 3. Configure environment variables

### 4. Start PostgreSQL

### 5. Run Prisma migration

### 6. Seed database

### 7. Start backend

### 8. Start frontend

## Docker Setup

Explain:

docker compose up --build

## Demo Credentials

Provide development-only demo credentials.

## API Documentation

List important API endpoints.

## Authorization Model

Explain:

OWNER
EDITOR
VIEWER

## Database Schema

Explain the major relationships.

---

# 30. Code Quality

Use TypeScript properly.

Avoid:

- any
- duplicated logic
- giant components
- hardcoded API URLs
- hardcoded board/task data
- unnecessary global state
- insecure authorization logic

Create reusable components.

Example frontend structure:

src/
├── components/
│   ├── ui/
│   ├── board/
│   ├── task/
│   └── layout/
│
├── pages/
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Dashboard.tsx
│   └── Board.tsx
│
├── hooks/
├── services/
├── api/
├── contexts/
├── types/
├── utils/
└── router/

Backend:

src/
├── controllers/
├── routes/
├── services/
├── middleware/
├── validators/
├── types/
├── utils/
├── prisma/
└── app.ts

Keep business logic out of route files where possible.

---

# 31. Important Backend Rule

The backend is the source of truth.

Do not depend on frontend authorization.

For every mutation:

Frontend permission check
+
Backend permission check

The backend must always enforce authorization independently.

---

# 32. Important Drag-and-Drop Rule

The drag-and-drop implementation must NOT only visually move cards.

Every movement must persist to PostgreSQL.

After refreshing the page, the exact order must remain.

Test:

1. Move task within column.
2. Refresh.
3. Verify order.

Then:

1. Move task to another column.
2. Refresh.
3. Verify column and order.

Then:

1. Login as another user.
2. Verify access permissions.

---

# 33. Testing

Implement basic backend tests for:

- Registration
- Login
- Unauthorized board access
- Board sharing
- Viewer restrictions
- Task creation
- Task movement
- Cross-column movement
- Same-column reordering
- Cross-board access prevention

Especially test authorization and task ordering.

---

# 34. Final Acceptance Criteria

The project is complete only when all of the following work:

- User can register.
- User can login.
- User can logout.
- User can create a board.
- User can view accessible boards.
- Owner can share board with another registered user.
- Owner can assign Editor/Viewer roles.
- Viewer cannot modify board data.
- Editor can manage board content.
- Owner has full control.
- User can create columns.
- User can edit columns.
- User can delete columns safely.
- User can create tasks.
- User can edit tasks.
- User can delete tasks.
- User can drag tasks.
- Tasks can be reordered within a column.
- Tasks can move between columns.
- Tasks can be inserted at a specific position.
- Task ordering persists after refresh.
- Unauthorized cross-board access is impossible.
- API validates all relationships.
- Database operations use transactions where necessary.
- Frontend has loading states.
- Frontend has error states.
- Frontend is responsive.
- UI follows the provided design.
- PostgreSQL works correctly.
- Prisma migrations work.
- Seed data works.
- Docker Compose works.
- README contains complete setup instructions.
- No secrets are committed.
- No fake/static functionality is used.

---

# 35. Development Approach

Build the application in this order:

1. Project setup
2. PostgreSQL + Prisma
3. Database schema
4. Prisma migrations
5. Authentication
6. Authorization
7. Board APIs
8. Member/sharing APIs
9. Column APIs
10. Task APIs
11. Task movement/reordering API
12. Frontend authentication
13. Dashboard
14. Board UI
15. Drag-and-drop
16. Optimistic updates
17. Error/loading states
18. Responsive design
19. Testing
20. Docker
21. README

Do not skip backend authorization or database integrity just to make the UI work faster.

---

# Final Requirement

Deliver a **fully functional full-stack Mini Kanban Board**, not a static prototype.

The application should be clean enough to be submitted as a professional coding assignment.

Use:

**Frontend:** React + TypeScript + Vite + Tailwind CSS

**Backend:** Node.js + Express.js + TypeScript

**Database:** PostgreSQL + Prisma

**Drag & Drop:** dnd-kit or an equivalent production-quality library

**Authentication:** JWT

**Deployment:** Docker / Docker Compose

Most importantly, **use my provided preferred design as the visual reference and reproduce its design language throughout the application.**