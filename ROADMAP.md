# Mini Kanban Improvement Roadmap

This roadmap prioritizes reliability and safe collaboration first, then improves the day-to-day board experience. Items are proposed milestones, not claims that the work is already complete.

## Phase 1 — Correctness, security, and a dependable baseline

### Backend

- **Make authorization checks consistent:** audit every route and mutation for board ownership, accepted membership, and role requirements. Validate that referenced tasks, columns, assignees, tags, and boards all belong together before writes.
- **Harden authentication configuration:** require a strong `JWT_SECRET` outside local development, add login/registration rate limits, and define a token expiry/refresh and logout policy.
- **Validate and normalize inputs:** apply Zod schemas to every write route, normalize email and string input consistently, and return a stable, documented error response shape.
- **Protect data integrity:** make multi-record operations (including task moves and membership changes) transactional. Use schema constraints and indexes for common lookups and ordering queries.
- **Add automated tests:** cover authentication, board role matrix (owner/editor/viewer), cross-board access attempts, CRUD validation, and task movement/order persistence.

### UI/UX

- **Make core flows resilient:** present actionable errors, preserve form input on recoverable failures, disable duplicate submissions, and confirm destructive actions with clear consequences.
- **Improve accessibility:** ensure dialogs, menus, filters, drag-and-drop actions, and form errors work with keyboard and assistive technology; provide non-drag alternatives for moving/reordering tasks.
- **Test responsive behavior:** verify dashboard, board views, task detail, and share/member management on narrow screens and touch devices.

**Exit criteria:** role/access tests pass for all protected operations; invalid and cross-board references cannot mutate data; key workflows are usable by keyboard and on mobile.

## Phase 2 — Faster, clearer board workflows

### UI/UX

- **Unify board interactions:** make Kanban, list, calendar, and analytics views share consistent filters, task actions, loading states, and empty states.
- **Improve task editing:** clarify required versus optional fields, surface assignee/tag context, and make saving/error state obvious in the task detail panel.
- **Make collaboration visible:** show member roles and invitation status clearly, explain permission limits in context, and improve feedback for invite/accept/decline flows.
- **Refine navigation and onboarding:** add helpful first-board/first-task guidance and make board switching, search, and active navigation state more discoverable.
- **Polish visual consistency:** standardize spacing, typography, contrast, focus states, responsive breakpoints, and light/dark theme behavior.

### Backend

- **Separate API concerns:** move repeated validation, authorization, and response mapping into shared helpers where it improves consistency; document endpoint contracts.
- **Make search and listing scalable:** add server-side filtering, pagination, and stable sorting for boards, tasks, members, and activity feeds.
- **Improve operational behavior:** use structured logs with request IDs, graceful shutdown, health/readiness checks, and explicit startup/configuration validation.

**Exit criteria:** common board actions have consistent behavior across views; large workspaces can be listed/searched without loading every record; API behavior is documented and observable.

## Phase 3 — Collaboration, scale, and release readiness

### UI/UX

- **Add collaboration feedback:** show useful activity history and indicate when board data may have changed elsewhere; consider real-time updates after the access and consistency foundations are tested.
- **Add user preferences:** persist useful view/filter preferences and provide clear profile, notification, and accessibility settings.
- **Validate with users:** gather feedback on board setup, task movement, and role sharing; prioritize issues by task completion and usability impact.

### Backend and delivery

- **Define production deployment practices:** use managed secrets, environment-specific CORS, HTTPS, backups, and a documented recovery procedure. Avoid shipping development credentials in Compose defaults.
- **Use safe database releases:** apply reviewed migrations during deployment rather than relying on schema push in production; document rollback and data migration procedures.
- **Add CI quality gates:** run frontend/backend builds, linting, unit/integration tests, and migration checks for every change.
- **Measure reliability:** track API latency/error rates and database health, and define basic availability and recovery targets before scaling.

**Exit criteria:** production configuration contains no default secrets, database changes are migration-driven and recoverable, and CI verifies the release-critical paths.
