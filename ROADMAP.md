# Mini Kanban Product Roadmap

This roadmap tracks the current implementation against the goal of a cohesive, secure work-management product. Status is based on the repository audit on 2026-10-17. “Implemented” means present in the application; it does not imply broad automated workflow coverage.

## Current product status

### Available today

- Registration and sign-in with JWT authentication and bcrypt password hashing.
- Workspaces (boards), members, invitations, Owner/Editor/Viewer roles, columns, and tasks.
- Kanban drag-and-drop plus list, calendar, and analytics views.
- Task priority, due dates, assignees, subtasks, comments, and activity history.
- Server-backed search for accessible boards and tasks.
- Theme preferences, profile editing, image upload, and Markdown workspace descriptions.
- MariaDB 11.4 through Prisma 6, migrations, and Docker Compose.
- No shipped demo accounts or seeded sample records.

### Stabilization completed in this phase

- Added board-role checks to task comments, subtasks, and activity reads/writes; viewers are read-only for these resources.
- Resolved board access from task, column, subtask, and comment resources so routes without a board ID cannot skip membership checks.
- Prevented task creation, task movement, and column deletion from mixing resources across workspaces.
- Validated task-order IDs and required complete, unique destination-column ordering; column reorder now requires all columns from the authorized workspace.
- Prevented API membership changes from granting an Editor or Viewer workspace-owner privileges and protected the actual workspace owner from ordinary role/removal changes.
- Added per-IP rate limits to sign-in, registration, and password changes.
- Require a configured JWT secret of at least 32 characters before the backend starts, and avoid returning internal exception messages for server errors.
- Added initial backend schema regression tests and frontend/backend `.env.example` files.

### Known gaps and risks

- Automated tests currently cover selected request-schema boundaries only. There are no HTTP integration or end-to-end tests for the role matrix, IDOR boundaries, invitation lifecycle, or task ordering.
- Request validation is not consistent across all controllers, notably subtasks, AI endpoints, and parts of membership/comment handling.
- Reordering is validated and written transactionally, but concurrent moves do not yet use conflict detection/retry or explicit order versions.
- Rate limits use the default in-process store; production multi-instance deployments need a shared store and carefully configured proxy trust.
- JWTs expire, but there is no refresh/revocation flow; a stolen unexpired token remains usable.
- The workspace Owner/Editor/Viewer rules need a complete, tested permission matrix. Ownership transfer is not implemented.
- The backend still needs production-grade configuration validation for all required environment variables, structured request logging, and graceful shutdown.
- The frontend production bundle exceeds Vite’s 500 kB warning threshold; route-level splitting and bundle analysis are pending.
- The product lacks a dedicated My Tasks view, favorites/recent projects, project lifecycle metadata, and a persistent event inbox. Existing notification UI does not represent a complete persistent notification system.
- There is no automated CI workflow for builds, tests, migrations, and authorization regressions.

## Prioritized implementation phases

## Phase 1 — Security and data integrity

**Status: Partially implemented.** This session closes several clear resource authorization and cross-workspace mutation gaps, adds basic auth rate limits, hardens production error responses, and adds schema tests. The rest remains a release blocker.

- [x] Enforce membership and role checks on task-related routes.
- [x] Validate that task, column, and ordering resources remain within the authorized workspace.
- [x] Prevent role endpoints from assigning Owner to members.
- [x] Rate-limit sign-in, registration, and password changes.
- [ ] Add full Zod validation for every mutating endpoint, including subtasks, comments, memberships, and AI generation.
- [ ] Specify and test the full authorization matrix, including resource owners, pending members, comment deletion, and workspace ownership transfer.
- [ ] Add integration tests for unauthenticated requests, Viewer writes, cross-workspace IDs, and role escalation.
- [ ] Add concurrency conflict handling/retries for task and column ordering; make multi-step state and activity writes atomic where required.

**Acceptance criteria:** all write routes reject invalid payloads consistently; cross-workspace ID substitution cannot read or mutate data; the role matrix is covered by automated API tests; concurrent order writes fail explicitly or resolve without duplicate/lost ordering.

## Phase 2 — Cohesive navigation and accessible design system

- Standardize shared forms, buttons, menus, tooltips, dialogs, loading feedback, and error/empty states without replacing working pages with mockups.
- Improve the app shell with clear current-workspace/project context, keyboard-accessible navigation, a responsive mobile navigation pattern, and persisted sidebar preference.
- Make every visible control perform an action or identify itself as unavailable.
- Audit keyboard access, focus restoration, screen-reader announcements, contrast, and reduced motion.

**Acceptance criteria:** core navigation and account/notification actions work at desktop and mobile widths; key flows can be completed using a keyboard; shared components provide consistent visual and interaction states.

## Phase 3 — Home, My Tasks, and project workflows

- Build a personalized home view from authenticated API data: assigned tasks, overdue/today/upcoming tasks, recent projects, and activity. Do not fabricate counts or trends.
- Add My Tasks with date groupings, filters, sorting, completion, and links to source workspaces.
- Improve workspace/project lifecycle management, including favorites/recent items and project status/dates only where justified by the existing board domain.
- Ensure filters and search remain coherent when switching between Kanban, list, calendar, and analytics.

**Acceptance criteria:** all dashboard metrics are backed by API responses; empty/new-user states are useful; My Tasks results are authorization-safe and point to their source boards.

## Phase 4 — Search and collaboration

- Refine global search with debounce, keyboard navigation, grouped results, loading/empty/error states, and sensible pagination.
- Decide whether persistent notifications are warranted; if so, add a notification model, migration, authorized APIs, unread state, and real events (assignments, comments/mentions, membership changes).
- Improve membership UX and document role actions; add ownership transfer with safeguards if supported.

**Acceptance criteria:** search returns only resources the user can access; notifications are generated from real events and can be marked/read consistently; membership changes cannot strand or silently elevate ownership.

## Phase 5 — Release readiness and performance

- Add CI for frontend/backend builds, tests, Prisma validation, and migration checks.
- Add API integration and browser workflow tests for authentication, workspaces, task lifecycle, ordering, and authorization.
- Add route-level frontend code splitting and analyze Markdown/editor bundle cost.
- Add structured logs, request IDs, readiness checks, graceful shutdown, backup/restore guidance, and production secret/CORS validation.
- Define migration and data-backup procedures for MariaDB and uploaded images.

**Acceptance criteria:** CI blocks regressions; a clean environment can be provisioned from documented steps; database and uploaded-image recovery is documented and tested; no development secret is accepted in production.

## Permission rules to preserve and verify

| Action | Owner | Editor | Viewer |
| --- | --- | --- | --- |
| View an accepted workspace and its tasks | Yes | Yes | Yes |
| Create/edit/delete tasks and manage ordering | Yes | Yes | No |
| Create/edit/delete columns | Yes | Yes | No |
| Manage subtasks and add comments | Yes | Yes | No |
| Read comments, subtasks, and activity | Yes | Yes | Yes |
| Invite members | Yes | Yes, subject to product policy | No |
| Change member roles or remove members | Yes | No | No |
| Delete workspace or transfer its ownership | Owner-only; transfer flow not implemented | No | No |

Comment authors may remove their own comments; workspace Owners may remove any comment. These rules must remain enforced in the API, not only by hiding frontend controls.
