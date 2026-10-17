# Taskgrid UI/UX Audit

## Scope and design constraints

Reviewed the application shell, dashboard/workspace directory, board header and
views, task cards and detail panel, task form, shared modal and form components,
authentication and profile pages, navigation, global search, notifications,
calendar, analytics, and theme-aware styling.
The implementation should continue using the existing emerald/slate palette,
light/dark/system theme, React/TypeScript stack, routes, and API contracts.
Asana is a workflow reference only; its visual identity is not a target.

## Prioritized findings

| Priority | Area | Finding | Status |
| --- | --- | --- | --- |
| P1 | Dialog accessibility | Shared dialogs did not move focus on open, trap keyboard focus, or restore focus on close; title IDs were shared across instances. | Fixed: shared modal now has per-instance accessible IDs, initial focus, tab trapping, and focus restoration. |
| P1 | Task creation | The create/edit task form did not focus its primary field when opened. | Fixed: task title receives initial focus in the shared modal. |
| P1 | Dashboard utility | The dashboard primarily summarizes workspace/task counts and lists workspaces; it does not surface a user's assigned tasks or upcoming/overdue work. | Open: the current API does not expose a cross-workspace task feed; do not fake these records. |
| P1 | Unsaved form changes | Clicking the modal backdrop can dismiss forms, and task forms do not warn before discarding edits. | Open: define a reusable dirty-form confirmation pattern and apply only to forms with unsaved changes. |
| P1 | Task editing feedback | The task detail panel saves several fields on blur/change, but saving is not consistently communicated and rapid edits can overlap. | Partially fixed: expose pending saves and use explicit description Save/Cancel with discard protection; field-specific recovery and rapid-edit verification remain open. |
| P1 | Responsive task detail | The task detail panel has responsive width/height constraints but dense sections and interactions need validation at mobile widths. | Partially fixed: compact aligned properties, checklist, description, and feed; desktop/tablet/mobile visual validation remains open. |
| P1 | Mobile navigation accessibility | The mobile sidebar behaves as a drawer visually, but does not expose dialog semantics or manage focus while open. | Open: add labeled drawer semantics, initial focus, Escape handling, focus containment, and focus return. |
| P2 | Collapsed navigation | Dashboard and profile icons had no accessible names/tooltips when the desktop sidebar was collapsed. | Fixed: provide accessible names and native tooltips for those links; workspace links already expose their names. |
| P2 | Board navigation | Board view/filter actions share a dense header; active filters and reset are available, but toolbar grouping and narrow-screen scanability need review. | Open: consolidate presentation while preserving all current filters and view actions. |
| P2 | Calendar discoverability | Tasks without due dates are absent from the calendar grid, with no separate indication in that view. | Open: add a clear unscheduled-task treatment if it can be done without duplicating or misrepresenting board data. |
| P2 | Cross-view consistency | List, calendar, analytics, and Kanban use different density and task-summary patterns. | Open: align task hierarchy and empty states while keeping each view's purpose. |
| P2 | Search feedback | Global search failures previously fell back to quick actions without explaining the failure, and its placeholder claimed column search unsupported by the API. | Fixed: search now reports recoverable errors with retry and names only supported board/task search. |
| P2 | Profile accuracy | The profile displayed a static “Verified User Account” badge without a verification signal in the user model. | Fixed: removed the unsupported verification claim. |
| P2 | List accessibility | Sortable headers and task-row navigation relied on pointer clicks rather than keyboard-operable controls. | Fixed: sort headers are buttons with sort state announced through `aria-sort`; task titles are keyboard-operable buttons. |
| P3 | Analytics context | Metrics are board-derived; empty/small data sets and chart explanations need review for clarity and non-misleading context. | Open: keep metrics data-backed and avoid decorative or inferred values. |
| P3 | Verification | There is no frontend component/workflow test suite, and responsive interaction checks are currently manual. | Open: prioritize tests around forms, dialogs, and task workflows before broad UI refactoring. |

## Implementation checklist

### Phase 1 — Audit

- [x] Inspect core frontend shell, navigation, dashboard, board/task views, shared dialogs/forms, and theme usage.
- [x] Record prioritized issues, current limitations, and decisions in this audit.

### Phase 2 — Foundations

- [x] Preserve existing brand colors, themes, routes, and component stack.
- [x] Add modal initial focus, keyboard focus trapping, focus restoration, and unique accessible title/description IDs.
- [x] Focus the task title when the task form opens.
- [x] Add accessible names/tooltips to collapsed Dashboard and Profile navigation.
- [x] Remove the unsupported static verified-account badge.
- [x] Make global search errors visible/retryable and align search copy with the backend.
- [x] Make List view sorting and task opening keyboard-operable.
- [x] Redesign task detail hierarchy with compact properties, a lightweight checklist, and distinct Discussion/Activity tabs.
- [x] Add task-panel dialog semantics, focus containment/restoration, Escape handling, and reduced-motion support.
- [x] Require explicit description Save/Cancel and protect unsaved description edits when closing or deleting.
- [ ] Review all icon-only controls, mobile drawer focus behavior, and shared form feedback.

### Phase 3 — Core workflows

- [ ] Improve dashboard task/deadline visibility when supported by a real API response.
- [ ] Refine board toolbar hierarchy, task-card scanability, and safe task editing.
- [ ] Align list, calendar, and analytics usability and empty states.

### Phase 4 — Consistency and accessibility

- [ ] Prevent accidental loss of dirty form data.
- [ ] Verify dialogs, dropdowns, keyboard operation, status announcements, and reduced motion.
- [ ] Test desktop, tablet, and mobile layouts, including board/task interactions.

### Phase 5 — Verification

- [ ] Run the production build after each implementation phase.
- [ ] Add focused frontend interaction tests when a test runner is available or introduced deliberately.
- [ ] Manually verify key workflows at desktop, tablet, and mobile widths.
- [ ] Revisit and update findings based on verification.

## Current phase notes

The task-detail sidebar now uses compact property rows, explicit description
save/cancel controls, and accessible Discussion/Activity tabs while preserving
the existing task APIs and role checks. Browser verification at desktop, tablet,
and mobile widths remains outstanding. Dashboard task feeds and additional
cross-workspace workflows require backend/API support; this audit does not
recommend client-side mock data or a backend rewrite solely to imitate another
product.
