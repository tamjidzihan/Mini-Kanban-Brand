# Design System — React / Next.js Edition

> **A React-first implementation specification.** This document describes *what* the interface looks like, *how* it behaves, and *how* to implement it in **React 19 + Next.js (App Router)** projects: file structure, Server vs Client Components, provider architecture, typed component APIs, Tailwind token configuration, and hooks.
>
> Framework-agnostic in spirit — every visual rule here works in any React setup (Next.js, Vite, Remix); only §1–§2 and §12–§13 assume Next.js specifics, with plain-React alternatives noted.

---

## Table of Contents

1. [Stack Decisions](#1-stack-decisions)
2. [Project Structure](#2-project-structure)
3. [Design Principles](#3-design-principles)
4. [Color System](#4-color-system)
5. [Typography](#5-typography)
6. [Iconography](#6-iconography)
7. [Spacing, Radius, Borders & Elevation](#7-spacing-radius-borders--elevation)
8. [Z-Index Layers](#8-z-index-layers)
9. [Motion & Animation](#9-motion--animation)
10. [Theming (Light / Dark)](#10-theming-light--dark)
11. [App Layout & Shell](#11-app-layout--shell)
12. [Navigation Model & Routing](#12-navigation-model--routing)
13. [State Architecture](#13-state-architecture)
14. [Component Library](#14-component-library)
15. [Charts Design Language](#15-charts-design-language)
16. [Page Layout Patterns](#16-page-layout-patterns)
17. [Responsive Strategy](#17-responsive-strategy)
18. [Keyboard Shortcuts](#18-keyboard-shortcuts)
19. [Accessibility Rules](#19-accessibility-rules)
20. [Data Formatting Conventions](#20-data-formatting-conventions)
21. [Content & Tone Guidelines](#21-content--tone-guidelines)
22. [Performance & Rendering Rules](#22-performance--rendering-rules)
23. [Do / Don't Checklist](#23-do-dont-checklist)

---

## 1. Stack Decisions

| Concern | Choice | Notes |
|---------|--------|-------|
| Framework | **React 19** | Function components + hooks only; no class components. |
| Meta-framework | **Next.js 15, App Router** (`app/` directory) | RSC-first; `"use client"` only where interactivity demands it. |
| Language | **TypeScript 5.x**, strict mode | Fully typed; no `any` in public component APIs. |
| Styling | **Tailwind CSS 3.4+** | Tokens configured once in `tailwind.config.ts`; no arbitrary hex values in JSX. |
| Class merging | `clsx` + `tailwind-merge` via a single `cn()` helper | Every component accepts `className?: string` merged through `cn()`. |
| Routing | Next.js App Router (`next/link`, `usePathname`, `useRouter`) | Plain React: react-router with the same rules. |
| Animation | **Framer Motion v12** | Client components only; see §9. |
| Charts | **Recharts 2.x** | Always rendered inside a `'use client'` chart wrapper. |
| Tables | **@tanstack/react-table v8** | Headless — all styling lives in our `<DataTable />`. |
| Forms | **react-hook-form** (+ optional `zod` schemas) | Validation messages follow §21 error tone. |
| Icons | **lucide-react** | Tree-shaken named imports only. |
| State | React Context + hooks; URL search params for filters | No Redux/Zustand unless the app outgrows context (§13). |

## 2. Project Structure

```text
app-root/
├── package.json
├── tailwind.config.ts        # All design tokens (§4–§8)
├── postcss.config.js
├── tsconfig.json             # paths: { "@/*": ["./src/*"] }
└── src/
    ├── app/                  # Next.js App Router ONLY (no components here)
    │   ├── layout.tsx        # <html>, fonts, <Providers> wrapper
    │   ├── globals.css       # @tailwind directives, base layer, scrollbar rules
    │   ├── page.tsx          # Home (/)
    │   ├── not-found.tsx     # 404 inside the shell
    │   └── (app)/            # route group sharing AppShell layout
    │       ├── layout.tsx    # renders <AppShell>{children}</AppShell>
    │       └── <section>/page.tsx   # one folder per page/route
    ├── components/
    │   ├── ui/               # Primitives (Button, Modal, …) — mostly 'use client'
    │   ├── layout/           # AppShell, Sidebar, Topbar, GlobalSearch…
    │   ├── charts/           # Recharts wrappers — always 'use client'
    │   ├── shared/           # cross-feature composites (Amount, StatusBadge…)
    │   └── <feature>/        # feature-specific composites
    ├── context/              # ThemeContext, ToastContext, DataContext, UiContext
    ├── hooks/                # useCountUp, useKeyboardShortcuts, useLocalStorage,
    │                         # useMediaQuery, useOnlineStatus
    ├── lib/                  # server-only data access, fetchers, shared constants
    │                         # (chartTheme.ts, motion.ts)
    ├── types/                # Domain types — types only, no runtime code
    └── utils/                # format.ts, calc.ts, export.ts, cn.ts — pure functions
```

Rules:
- `types/`, `utils/`, `lib/` constants contain **zero JSX and zero side effects**, so any module can be imported from Server Components.
- One component per file; **named exports** (`export function Button(...)`), imported as `import { Button } from '@/components/ui/Button'`.
- Never import *upward* across layers: `ui/` may not import from features/pages; `shared/` may import only `ui/` + `utils/`.
- Path alias `@/` → `src/`; no relative `../../` chains longer than one level.

## 3. Design Principles

1. **Calm data density** → semantic color tokens live in `tailwind.config.ts`; components reference token classes (`bg-rose-50 dark:bg-rose-500/10`), never inline hex.
2. **One accent, many semantics** → export a `semanticColor` map (`income: 'emerald'`, `expense: 'rose'`, `pending: 'amber'`, `transfer: 'sky'`, `documents: 'violet'`); components consume the map, not raw names.
3. **Soft modern surfaces** → shadow/radius tokens defined once in Tailwind config; every surface uses them via class names.
4. **Motion with restraint** → Framer Motion variants exported from a single `lib/motion.ts`; durations/easings are constants there, never re-declared per component.
5. **Dark mode is first-class** → every className that sets a light surface carries its paired `dark:` class in the same string; enforced by review + ESLint rule if available.
6. **Progressive disclosure** → dense table row actions behind `<Dropdown />`; toolbars collapse via `useMediaQuery`; secondary info sits under truncated labels and tooltips.
7. **Keyboard-first power use** → one global `useKeyboardShortcuts()` hook mounted in the app shell (§18).
8. **Optimistic, forgiving UX** → destructive actions = ConfirmDialog + toast with Undo; empty states always suggest a next action.

---

## 4. Color System

### 4.1 Core palette
| Token | Hex | Semantic role |
|-------|-----|---------------|
| `emerald-600` | `#059669` (accent `#10b981`) | Brand accent: primary buttons, income, active nav, success states, focus rings |
| `teal-600` | `#0d9488` | Logo gradient end only |
| `rose-600` | `#e11d48` (`#f43f5e`) | Negative money & danger: expenses, negative amounts, destructive buttons, error text |
| `amber` | `#f59e0b` | Warning/pending badges, caution states, favorites star |
| `sky` | `#0ea5e9` | Movement: transfers, profit lines, secondary info series |
| `blue` | `#3b82f6` | Information toasts, generic data series |
| `violet` | `#8b5cf6` | Documents/invoices, secondary volume series |

Never use semantic colors decoratively.

### 4.2 Neutrals (paired light/dark classes)
| Token | Light classes | Dark classes |
|-------|--------------|--------------|
| Canvas | `bg-gray-50` | `dark:bg-gray-950` |
| Surface (cards) | `bg-white` | `dark:bg-gray-900/70…95` |
| Subtle surface (thead, footer bars) | `bg-slate-50` | `dark:bg-gray-900` |
| Hairline border | `border-gray-200/80` | `dark:border-gray-800` |
| Input border | `border-gray-300` | `dark:border-gray-700` |
| Primary text | `text-slate-900` | `dark:text-slate-100` |
| Secondary text | `text-slate-600` / `slate-500` | `dark:text-slate-300` / `slate-400` |
| Muted/meta + placeholder | `text-slate-400` | `dark:text-slate-500` |
| Scrim | `bg-slate-950/50 backdrop-blur-sm` (4px blur) | same |

### 4.3 Recipes (as Tailwind class strings)
```ts
// lib/colors.ts — tinted chip (icon tiles, trend pills)
export const tintedChip = (c: string) =>
  `bg-${c}-50 text-${c}-600 dark:bg-${c}-500/10 dark:text-${c}-400`;

// status badge — soft ring look
export const statusBadge = (c: string) =>
  cn(`bg-${c}-50 text-${c}-700 ring-1 ring-inset ring-${c}-600/15`,
     `dark:bg-${c}-500/10 dark:text-${c}-400 dark:ring-${c}-500/20`);
```
Focus ring: emerald at 40% alpha on inputs (`ring-2 ring-emerald-500/40`), 50% on buttons, always `focus-visible:` prefixed. Error focus swaps to rose at 30%. Text selection highlight: emerald at 25% (globals.css). Category/icon tile with a raw brand hex: `style={{ backgroundColor: hex + '1a', color: hex }}` (≈10% alpha bg, full-color glyph).

### 4.4 Chart series constants
```ts
// lib/chartTheme.ts
export const CHART = {
  income: '#10b981',
  expense: '#f43f5e',
  profit: '#0ea5e9',
  volume: '#8b5cf6',
  positiveBar: '#3b82f6',
  negativeBar: '#f43f5e',
  grid: 'rgba(148,163,184,.15)',   // dashed 3-on/3-off, horizontal only
  tick: '#94a3b8',                 // 11px, no axis/tick lines
} as const;
```

## 5. Typography

- **Font:** Inter via `next/font` (`next/font/google`, `display: 'swap'`) in the root `layout.tsx`; assign to a CSS variable and map it as Tailwind's `fontFamily.sans`. Plain React: self-host or link + fallback stack `ui-sans-serif, system-ui, sans-serif`. One family for the whole product — hierarchy via weight and size only.
- Rendering: antialiased (`-webkit-font-smoothing: antialiased`), `text-rendering: optimizeLegibility`.

| Style | Classes | Usage |
|-------|---------|-------|
| Page title (h1) | `text-lg font-bold tracking-tight` | One per page header |
| Modal title (h2) | `text-base font-semibold` | Dialog headings |
| Card title (h3) | `text-sm font-semibold` | Chart cards, list headers |
| Body / table cell | `text-sm` regular | Default content |
| Secondary body | `text-xs font-medium` | Subtitles, descriptions, meta rows |
| Micro text | `text-[10px]` / `text-[11px]` | Eyebrows, badges, kbd hints, timestamps |
| Numbers | `tabular-nums font-semibold` (or `font-bold`) | All amounts, percentages, counters |
| Eyebrow label | `text-[10px] font-semibold uppercase tracking-[0.08em]` | Sidebar sections, dropdown group labels |

Rules:
- Headings use negative letter-spacing to feel modern; never underline links except on hover.
- Single-line overflow truncates with ellipsis (`truncate`); multi-line descriptions clamp at ~2 lines (`line-clamp-2`).

## 6. Iconography

- **lucide-react** named imports — 24px grid, 2px stroke, rounded caps/joins. Standard sizes via the `size` prop:
  - `size={18}` — topbar buttons, sidebar nav icons
  - `size={16}` — inline buttons, input adornments
  - `size={14}` — small badges inside buttons
  - `size={20}` (24px box) — logo glyph
- Icons inherit `currentColor` unless placed inside a tinted chip.
- Every icon-only control **must** have an `aria-label`.
- Domain → icon mappings live as typed lookup tables: `Record<string, LucideIcon>` with a fallback icon for unknown keys.

## 7. Spacing, Radius, Borders & Elevation

### 7.1 Spacing — 4px base grid
Card padding `p-4 sm:p-5`; page gutter `px-4 sm:px-5 lg:px-6`; table cells `py-2.5 px-4`; list items `py-2.5 px-5`; section & grid gap `gap-4`; form field vertical gap `space-y-4`; label→control gap `mb-1.5`.

### 7.2 Radius
Cards/modals(desktop)/drawer headers `rounded-2xl`; mobile bottom sheets top corners only; buttons/inputs/selects/nav items `rounded-lg`; badges/toasts/dropdown panels/progress tracks `rounded-xl` (badges pill = `rounded-full`); icon tiles/chips `rounded-xl`; avatars/dots/scrollbar thumb full circle.

### 7.3 Borders
Hairline 1px borders everywhere; never decorative 2px+. Inputs get a slightly stronger border than cards. List dividers `divide-y divide-gray-100 dark:divide-gray-800/60`.

### 7.4 Shadows (tailwind.config.ts extensions)
```ts
boxShadow: {
  soft:     '0 1px 2px rgba(15,23,42,.04), 0 4px 12px -2px rgba(15,23,42,.06)',
  card:     '0 1px 2px rgba(15,23,42,.04), 0 4px 16px -4px rgba(15,23,42,.08)',
  dropdown: '0 4px 6px -1px rgba(15,23,42,.06), 0 12px 28px -8px rgba(15,23,42,.18)',
  glow:     '0 0 0 1px rgba(16,185,129,.16), 0 6px 24px -6px rgba(16,185,129,.3)',
},
```
Usage: `soft` = logo mark · `card` = default cards · `dropdown` = dropdowns, modals, drawers, toasts, hover-lift · `glow` = primary FAB only.
Hover-lift pattern: `transition-all duration-200 hover:-translate-y-0.5` + shadow card→dropdown.

## 8. Z-Index Layers

| Layer | z-class | Contents |
|-------|---------|----------|
| Base content | auto | Pages, cards |
| Sticky topbar | `z-40` | Header, mobile FAB |
| Dropdown panels | `z-50` | Menus, popovers |
| Tooltip | `z-[60]` | CSS tooltips |
| Mobile search overlay | `z-[70]` | Full-width search sheet |
| Modal / Drawer | `z-[80]` | Dialogs, side panels |
| Toasts | `z-[100]` | Always on top |

## 9. Motion & Animation

All animation runs through **Framer Motion** in `'use client'` components. Centralize variants in one module:

```ts
// lib/motion.ts
import type { Variants } from 'framer-motion';

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};
export const stagger = (per = 0.05) => ({
  hidden: {},
  show: { transition: { staggerChildren: per } },
});
export const overlaySpring = { type: 'spring', stiffness: 320, damping: 32 } as const;
export const toastSpring   = { type: 'spring', stiffness: 380, damping: 30 } as const;
```

| Interaction | Spec |
|-------------|------|
| Hover/color transitions | `transition-colors duration-150`–`200`, ease |
| Dropdown open/close | 140ms ease-out — opacity + 6px rise + scale .98 |
| Modal / drawer | spring stiffness 320, damping 30–34; scrim fades only, panel from y+24 / scale .98 |
| Toasts | spring 380/30; exit slides right 40px; stack bottom-right via `<AnimatePresence>` + layout; max 4 visible |
| Card entrance | `fadeUp` variant — 300ms fade + 12px rise, staggered 50ms per item |
| Progress fill | 500ms eased, width clamped [2%,100%] |
| Number count-up | rAF easeOutCubic `1-(1-p)^3`, 700–800ms → `hooks/useCountUp.ts` |

Micro-interactions:
- Button press scales to `.98` while active (`active:scale-[.98]`).
- FAB taps to `.92`; its "+" icon rotates 45° when the speed-dial opens.
- Sidebar collapse animates width 256px ↔ 80px over 200ms.
- Modal scrim fades; drawer slides from off-screen edge (±100%).
- Keyframes: `fade-in`, `fade-up` (8px), `scale-in`; skeletons use continuous pulse (`animate-pulse`).

## 10. Theming (Light / Dark)

- **Strategy:** a `dark` class on `<html>` switches every color pair (`darkMode: 'class'` in Tailwind). In Next.js set it with an inline before-paint script or `next-themes`: read persisted choice (`localStorage['app-theme']`) first, fall back to OS `prefers-color-scheme`.
- Context shape:
```ts
// context/ThemeContext.tsx
interface ThemeContextValue {
  theme: 'light' | 'dark' | 'system';
  resolvedTheme: 'light' | 'dark';
  setTheme(t: ThemeContextValue['theme']): void;
  toggle(): void;
}
```
- Every component defines both modes simultaneously with paired tokens (§4.2); never hardcode hexes inside components.
- `color-scheme: light dark` on root so native form controls and scrollbars follow the scheme.
- Scrollbars: thin, 8px, rounded thumb slate-300 (light) / slate-700 (dark), transparent track — styled once in globals.css.
- Persisted choice wins over OS preference; default = OS.

## 11. App Layout & Shell

```text
┌──────────┬──────────────────────────────────────────────┐
│          │  TOPBAR (h-16, sticky z-40, frosted blur)    │
│ SIDEBAR  ├──────────────────────────────────────────────┤
│ w-64     │                                              │
│ (or w-20)│   MAIN CONTENT                               │
│          │   max-w-[1400px] centered                    │
│ collaps. │   padding px-4 sm:px-5 lg:px-6               │
│          │   vertical stack of sections, gap-4          │
└──────────┴──────────────────────────────────────────────┘
```

- Full viewport height (`h-screen overflow-hidden`); internal scrolling in `<main>` only (`overflow-y-auto`).
- **AppShell** is a client component wrapping `{children}` so pages can stay Server Components in Next.js.
- Sidebar zones: **Brand** (h-16 tile + product name, bottom border) → **scrollable nav** → **user chip** pinned at bottom above top border.

### 11.1 Sidebar nav item
Height ~36px (`py-2`), icon 18px + label 13px medium, gap-3, radius-lg. Default text slate-500; hover slate-100 bg + darker text. Active state (detected via `usePathname()`, exact match for `/`):
- emerald tinted chip bg + emerald text,
- **4×20px emerald indicator bar** flush on the left edge (`absolute left-0 rounded-r`),
- optional count badge: rose pill (translucent rose in dark) that collapses to an 8px rose dot at the item's top-right when the rail is collapsed; eyebrow labels hidden when collapsed.

### 11.2 Topbar (left → right)
1. Hamburger (mobile/tablet only) → opens nav drawer
2. Sidebar collapse toggle (desktop)
3. Global search input (desktop): `w-56 focus:w-72`, search icon left, `⌘K` kbd chip right, results dropdown below
4. Spacer · today's date (≥sm screens) · theme toggle · notifications bell (rose unread dot-badge, dropdown with "mark all read" and footer link) · quick-add "+" primary button (300px dropdown grid of actions) · profile avatar menu

Topbar classes: `sticky top-0 z-40 border-b border-gray-200/80 bg-white/85 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/85`.

### 11.3 Mobile additions
Sidebar becomes a left Drawer (290px, max 85vw), closes on navigation; FAB bottom-right (56px emerald circle, `shadow-glow`) expands a vertical speed-dial of pill buttons ("+" rotates to "×"); global search becomes a full-width top sheet (results max-h 70vh); amber offline banner under topbar when `useOnlineStatus()` is false.

## 12. Navigation Model & Routing

### 12.1 Next.js (App Router)
- One route folder per page under `src/app/(app)/`; each `page.tsx` is preferably a Server Component that fetches data and passes it to client feature components.
- `not-found.tsx` renders the 404 inside the shared shell; add a root `error.tsx` with matching card styling for runtime errors.
- Active-link detection uses `usePathname()` in a small `<NavLink>` client component; exact match (`=== '/'`) for the index route, prefix match otherwise.
- Cross-links use `next/link` (emerald link styling, underline on hover only); programmatic navigation via `useRouter().push()`.
- Unknown URLs render a centered 404 page (large "404", message, back-home button) inside the same shell.

### 12.2 Nav configuration
- The sidebar/nav structure is **data-driven**: one `components/layout/navigation.ts` exporting an array of sections (`{ label, items: { label, href, icon, badge? } }[]`); both the desktop Sidebar and the mobile Drawer consume it. Never duplicate nav definitions.
- Sidebar links navigate client-side without reload; cross-links inside pages ("View all →") use emerald link styling.

### 12.3 Plain React equivalent
react-router with a layout route rendering `<AppShell />` and nested child routes; active detection via `useLocation().pathname`. All other rules identical.

## 13. State Architecture

### 13.1 Provider order
```tsx
<ThemeProvider>            // theme + resolvedTheme
  <ToastProvider>          // toast viewport + push API
    <DataProvider>         // domain entities + mutations (if needed)
      <UiProvider>         // sidebar collapsed, drawers, search open, modals
        {children}
```
In Next.js these live together in one `'use client'` `<Providers>` component rendered by the root `layout.tsx`.

### 13.2 Context rules
- **DataContext** (when present) holds domain state + mutation functions; persist user-modifiable slices through `useLocalStorage`.
- **UiContext** holds ephemeral UI state only — never domain data.
- Every context exposes a `useXxx()` hook that throws if used outside its provider (fail-fast).
- Keep context values stable via `useMemo`; split contexts if profiling shows re-render churn.

### 13.3 Server-state boundary (Next.js)
- Initial entity data comes from Server Components / Route Handlers via `fetch`; hydrate DataContext from the server payload instead of fetching again on the client.
- Mutations go through **Server Actions** or Route Handlers; on success update the client state optimistically, then reconcile.
- Filters/sort/page belong in **URL search params** (`useSearchParams`) so list views are shareable — not in context.

### 13.4 Plain React equivalent
Seed contexts from local/mock data or an API layer of your choice; keep the same provider order and hook contracts.

## 14. Component Library

Conventions for ALL components (client unless noted):
- Fully typed props interfaces exported alongside the component; `className?: string` merged via `cn()`; extend native props where sensible (`extends React.ButtonHTMLAttributes<HTMLButtonElement>`).
- Both themes required; focus-visible ring always present; disabled = `opacity-50 cursor-not-allowed`.
- **Server-Safe** components (no state/effects/portals — render fine in RSC): Badge, Avatar, Card, EmptyState, PageHeader, ProgressBar, Skeleton, StatCard (without count-up), Amount, StatusBadge, icon tiles. Everything with state, portals, or effects is `'use client'`.

### 14.1 Button
```ts
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'icon';
}
```
- primary: `bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800`
- secondary: white bg + `border-gray-300` + `text-slate-700`, hover gray-50
- ghost: no bg, `text-slate-500`, hover slate-100 + slate-700 (icon buttons)
- danger: rose-600/700 · success: sky-600/700 (confirm-type actions)
Sizes: sm `px-3 py-1.5 text-xs`, md `px-4 py-2 text-sm`, icon 36×36 (`h-9 w-9`). All: `inline-flex items-center gap-2 rounded-lg font-medium transition-all active:scale-[.98]`.

### 14.2 Card
`rounded-2xl border border-gray-200/80 bg-white shadow-card dark:border-gray-800 dark:bg-gray-900/70`; padding `p-4 sm:p-5`, `p-0` variant for tables/lists with internal header/divider rows; optional hover-lift (§7.4).

### 14.3 Badge
Pill `px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset` per §4.3 recipe. Tones: green/red/amber/blue/sky/violet/gray/emerald; optional 6px leading status dot in the current color. Status mapping pattern: completed/paid/active = green · pending = amber · failed/overdue = red · cancelled/draft/inactive = gray.

### 14.4 Avatar
Circle sm 32 / md 36 / lg 48px. No image → initials (first letters of first two words, uppercase) on a deterministic color from `[emerald, blue, violet, rose, amber, sky, teal]` hashed from the name; white semibold text. Optional 10px online dot bottom-right with a 2px ring matching surface bg.

### 14.5 Input / 14.6 Select / 14.7 Textarea / 14.8 Checkbox
Block label above: `text-xs font-semibold text-slate-600`. Field: full width, rounded-lg, `border-gray-300 dark:border-gray-700`, py-2 px-3, text-sm, placeholder slate-400; focus = emerald border + `ring-2 ring-emerald-500/40 outline-none`. Error state: rose border/ring + 12px rose message below. Select adds a chevron-down adornment right (`pr-9`, appearance-none). Textarea same styling, `resize-none rows={2}`. Checkbox 16px rounded border with emerald accent, inline label gap-2 cursor-pointer.

### 14.9 Modal
Client component; portal to `document.body` (or native `<dialog>`). Scrim slate-950/50 + blur(4px) closes on click; panel max-h 92vh flex-col, widths sm 384 / md 448 / lg 512 / xl 672px; centered ≥sm screens, **bottom sheet on mobile** (full-width, top-rounded). Optional header (title h2 + description + close icon-button), scrollable body p-5, footer right-aligned buttons on tinted bar. Esc closes; body scroll locked while open; entrance spring y+24/scale .98. ARIA: `role="dialog" aria-modal="true"`.

### 14.10 ConfirmDialog
Modal sm; semibold sentence title + small muted description stating consequence plainly; footer Cancel (secondary) + Confirm (primary, or danger when destructive); no X button needed.

### 14.11 Drawer
Side panel (default right; nav uses left): full-height 290px max-85vw surface, optional header w/ title + close, scrollable body; same scrim/Esc/scroll-lock rules as Modal; slides ±100% with spring.

### 14.12 Dropdown (popover)
Trigger wrapper toggles anchored panel below trigger (aligned right default): `mt-2 rounded-xl border shadow-dropdown p-1.5 origin-top` scale/fade in 140ms; closes on outside mousedown + Esc; children may be a render-prop receiving `close()`. Width configurable (256/300/320px).

### 14.13 Tooltip
CSS-only: wrapper `group relative`; bubble absolutely positioned above/below, centered, whitespace-nowrap, slate-900 bg (slate-700 dark), white 11px medium, rounded-md px-2 py-1, opacity transition 150ms; shows on hover **and** focus-within; `role="tooltip"`, `z-[60]`.

### 14.14 Tabs
Segmented control: container `inline-flex rounded-xl border bg-gray-100/80 p-1` (horizontally scrollable when narrow); tab button `rounded-lg px-3 py-1.5 text-xs font-medium` with optional 14px icon; active = white bg + shadow-sm + dark text, inactive = slate-500 → hover darker. ARIA tablist/tab/aria-selected required.

### 14.15 ProgressBar
Track h-2 full-width pill slate-100 (gray-800 dark). Fill pill width clamped [2%,100%], 500ms eased; tones emerald/rose/amber/blue/violet; **auto-overrides to rose when value > max**; optional right label: 11px semibold tabular percent, rose when over.

### 14.16 EmptyState
Centered column py-12 px-6: 48px rounded-2xl slate-100 tile + 24px slate icon; title 14px semibold; description 12px muted max-w-sm; optional action slot below (usually a Button).

### 14.17 Skeleton
`animate-pulse rounded-lg bg-slate-200/80 dark:bg-gray-800`. Presets: StatCardSkeleton (icon square + value bar w-28 + label bar w-20 + sparkline area) and ChartSkeleton (title bar w-40 + 208px plot area), mirroring final layout.

### 14.18 StatCard
Card p-4 containing: ① row of 36px tinted icon chip + optional trend pill top-right (arrow-up/down-right + signed percent, green/red recipe §4.3) · ② 18px bold tabular tight-tracked value with count-up animation · ③ 12px medium muted label · ④ optional 40px mini area sparkline in the stat color (`aria-hidden`). Entrance fade+rise staggered 50ms per card index.

### 14.19 PageHeader
Row stacking on mobile: optional 40px rounded-xl tinted icon tile; h1 title + 12px description; right-side action buttons wrap; margin-bottom 20px.

### 14.20 ChartCard
Card wrapping any chart: header row = title (14px semibold) + optional subtitle + right action slot; chart container default height 260px, margin-top 16px.

### 14.21 DataTable
Built on @tanstack/react-table inside a Card `p-0`: optional toolbar row (`border-b px-4 py-3 flex-wrap` controls), horizontally scrollable table, empty state slot, footer pagination bar.
- Header cells: slate-50 bg, `text-[11px] font-semibold uppercase tracking-wider` muted; sortable headers clickable w/ up/down chevron (emerald when active) or faint double-chevron idle.
- Rows: py-2.5 px-4, hairline bottom border (last none), hover slate-50 tint, text-sm slate-600.
- Footer: "Showing X–Y of Z" left (12px bold numbers); right = page-size select `[8,12,20,50]` labeled "N / pg" + prev/next ghost icon buttons + "page / total".
- Default page size 8; accepts an external global-filter string prop.

### 14.22 Icon tile / category glyph pattern
Typed lookup table name→Lucide icon with a fallback tag icon for unknown keys; renders a rounded-xl tile using the item's hex at ~10% alpha background with the full-color glyph — same recipe as §4.3.

### 14.23 Amount (semantic money text)
Inline value: semibold tabular nowrap. Positive/income → `+` prefix in emerald; negative/expense → `−` prefix (U+2212) in rose; neutral/plain → slate-700. Currency symbol comes from app settings/context — never hardcode a symbol.

### 14.24 Toast
Viewport fixed bottom-right `z-[100]`; card radius-xl border shadow-dropdown blur; left accent bar by type (success=emerald, error=rose, info=blue); title 12px semibold + optional description; optional action button (e.g. Undo). Spring in/out per §9; stack bottom-right, new ones push others via layout animation; max **4** visible (oldest removed). API shape:
```ts
const toast = useToast();
toast.success('Saved', { action: { label: 'Undo', onClick: restore } });
toast.error('Something went wrong');
toast.info('Opened the page.');
```

### 14.25 GlobalSearch
Opens via topbar input or Ctrl/⌘K. Desktop: dropdown panel below the input; mobile: full-width top sheet `z-[70]` with its own input row and scrollable results (max-h 70vh). Result rows: 28px icon tile (type-tinted), 12px medium label, 11px muted sub-label; hover slate-100 bg; click navigates to the section and closes. Matching is case-insensitive substring over name/category/reference/email fields; empty query → hint line; no matches → centered "No results for 'query'" muted message.

### 14.26 Quick Actions grid
2-column grid of action tiles: rounded-xl border (gray-100 / gray-800), white bg, p-3, left-aligned; 32px tinted icon tile + 12px semibold label; hover emerald border/tint wash. Reusable inside a topbar "+" dropdown AND as a dashboard card.

### 14.27 Record Form Modal ("add/edit" pattern)
Modal xl driven by react-hook-form (+ zod schema colocated):
1. **Type selector** — 3 equal segmented tiles (e.g. Income=emerald / Expense=rose / Transfer=sky); active = solid variant color + white text; inactive = bordered ghost; distinct icons per type.
2. Amount input (large numeric, required) + Date input side-by-side.
3. Description text input; Category select (hidden for transfer → replaced by an info note: sky-tinted rounded box).
4. Two-column grid: primary reference select ("From" for transfers) + secondary select (To-account / payment method).
5. Reference-number input + Status select.
6. Tags input (comma-separated) + Notes textarea (2 rows).
7. Row: recurring checkbox + attachment pseudo-link (paperclip icon; hidden file input shows chosen filename).
Footer: Cancel (secondary) + Save/Add (primary). Validation: required fields use the rose error recipe §14.5.

### 14.28 List page-block (toolbar + table)
Toolbar above the DataTable with wrapping filter controls: search input (~200px with icon) · type/status/category selects · date-range selects (all/today/yesterday/week/month/custom + from/to inputs when custom) · toggle button for favorites/starred filter · Export CSV secondary button · Add primary button.
Row cells: icon tile + title (+ sub-line), relative day + time, category/type, colored Amount, StatusBadge, favorite star toggle, row menu (`⋯` Dropdown: Edit / Duplicate / Delete → ConfirmDialog). Delete triggers success toast with **Undo** action restoring the record.

### 14.29 Shortcuts Help modal
sm modal listing each shortcut as a slate-50 rounded row: action label left, kbd chips right (bordered 10px chips per key); ends with an emerald tip callout recommending ⌘K.

### 14.30 Activity Timeline
Card list with a vertical connector line (1px light gray) running through 28px circular icon nodes. Node = tinted circle per activity type with 4px surface-colored ring punching through the line. Title 12px medium; description 11px muted truncated.

## 15. Charts Design Language

All charts are `'use client'` Recharts wrappers in `components/charts/`. Shared: ResponsiveContainer 100%×100% inside ChartCard (default height 260px), no axis lines/tick marks, tick text `#94a3b8` 11px, dashed horizontal-only grid `rgba(148,163,184,.15)` (`3 on / 3 off`), rounded bar tops (radius 4), maxBarSize 14–22, shared tooltip: white/95 (gray-900/95) radius-xl bordered card w/ blur + dropdown shadow; bold label line; per-series rows = 8px color dot + name + bold tabular value.

Canonical chart set:
| Chart | Type | Series & styling |
|-------|------|------------------|
| Comparison bars | Composed grouped bars + trend line | Positive #10b981 vs negative #f43f5e, barGap 4, plus trend line |
| Flow areas | Dual gradient area | Inflow #10b981 / Outflow #f43f5e, stroke 2px, vertical gradient fill 28%→0% alpha |
| Signed bars | Per-bar color by sign | #10b981/#f43f5e, maxBarSize 22 |
| Composition donut | Pie innerRadius 58 outer 86 | paddingAngle 2°, strokeWidth 0, palette slices; dot+name legend below/beside |
| Horizontal ranking bars | Horizontal bars | Blue positive / rose negative, radius right side only, maxBarSize 14 |
| Volume bars | Vertical bars | Violet #8b5cf6, integer ticks only |
| Revenue combo | Area + line | Area #10b981 gradient + profit line #0ea5e9 (no dots) |
| Stat sparkline | Mini area 40px | Color per stat, gradient 35%→0%, `aria-hidden` |

Y-axes use compact currency formatting ($1.2K); X labels auto-thinned (`interval="preserveStartEnd"`).

## 16. Page Layout Patterns

Standard page: PageHeader → optional Tabs/filter toolbar → content grid `gap-4`.

- **Dashboard pattern:** row of 4 StatCards (grid 1→2→4 cols) → range tabs → charts row 1 (`grid-cols-1 lg:grid-cols-3` — 2fr comparison chart + 1fr donut) → charts row 2 (2fr flow area + 1fr ranking bars) → bottom rail (2fr recent-records list + 1fr [Quick Actions card, Activity timeline]).
- **List pages:** PageHeader + single full-width DataTable block with filter toolbar.
- **Detail/people pages:** header + stat strip or search, then Card list or DataTable.
- **Settings/Profile:** sectioned cards with forms; avatar header on Profile.
- While loading ≥ ~300ms, pages render skeleton equivalents of the layout.

In Next.js each page is a Server Component that fetches data, then composes these client feature blocks.

## 17. Responsive Strategy

Mobile-first; key changes at **md (768px)** and **lg (1024px)**.

| Feature | < md | md–lg | ≥ lg |
|---------|------|-------|------|
| Sidebar | hidden (drawer) | icon rail 80px forced | full 256px, user-collapsible |
| Search | overlay sheet | input (expands on focus) | same |
| Date in topbar | hidden | icon only | icon + text |
| Profile name text | hidden | hidden | visible |
| FAB quick-add | shown | shown | hidden |
| Modal placement | bottom sheet | centered dialog | centered dialog |
| Dashboard grids | 1 col | mixed | 2–4 col splits (2fr/1fr) |
| Table toolbars | wrap to multiple rows | wrap | single row |

Sidebar collapse state persists to `localStorage['app-sidebar-collapsed']`; theme persists (`app-theme`). Detect breakpoints via the `useMediaQuery` hook + Tailwind responsive classes; never JS-only breakpoints for pure styling.

## 18. Keyboard Shortcuts

| Keys | Action | Notes |
|------|--------|-------|
| `Ctrl/⌘ + K` | Open global search | Works anywhere, even while typing |
| `Ctrl/⌘ + N` | New record modal | Works anywhere |
| `Ctrl/⌘ + D` | Toggle dark mode | Works anywhere |
| `?` | Shortcuts help modal | Suppressed while typing in inputs |
| `Esc` | Close topmost overlay | Modals, drawers, dropdowns, search |

Implementation: one `useKeyboardShortcuts()` hook mounted once in the AppShell; handlers dispatch app-level events (or call UiContext actions). Typing detection checks `target.tagName ∈ {INPUT, TEXTAREA, SELECT}` or `isContentEditable`; modifier combos bypass the check. The help modal lists shortcuts with kbd chips.

## 19. Accessibility Rules

- Every **icon-only button** has an accessible name (`aria-label`), e.g. "Toggle dark mode", "Notifications (3 unread)".
- Dialogs: `role="dialog"` + `aria-modal="true"`; labeled close buttons ("Close dialog", "Close drawer", "Dismiss notification").
- Tabs: `role="tablist"` / `role="tab"` / `aria-selected`.
- Tooltips: `role="tooltip"`, visible on focus-within too.
- Decorative visuals (sparklines, initials avatars) marked `aria-hidden`.
- Forms: programmatic label association (`htmlFor`/`id`); errors as text below the field with `aria-describedby`.
- Focus: visible ring on all interactive elements; keyboard Esc everywhere; body scroll lock while overlays open; focus moves into search input when opened via shortcut and returns to the trigger on close.
- Contrast ≥ 4.5:1 for text per the slate pairs (§4.2).
- Semantic landmarks: `<nav>` sidebar, `<header>` topbar, `<main>` content; skip-to-content link as the first focusable element.
- Toast viewport acts as a live region (announce new toasts in screen-reader contexts).

## 20. Data Formatting Conventions

Implement in `utils/format.ts` using `Intl` — never hand-rolled strings. Helpers must be pure functions so Server Components can use them directly.

| Data | Format | Example |
|------|--------|---------|
| Currency standard | Intl currency, en-US, 2 decimals | `$1,234.56` |
| Currency compact (axes) | notation compact, max 1 decimal | `$1.2K` |
| Percent change | signed, 1 decimal, always explicit sign | `+12.5%` / `-3.0%` |
| Numbers | en-US grouping | `12,480` |
| Date long / short | "Mon D, YYYY" / "Mon D" | `Aug 21, 2026` / `Aug 21` |
| Time | 12h "H:MM AM/PM" | `9:30 AM` |
| Relative day | Today / Yesterday / Mon D | — |
| Month key | `YYYY-MM` | budgets |
| File size | B → KB (1dp) → MB (1dp) | `2.4 MB` |
| Days until | ceil of ms diff / day | due badges |
| CSV export | client-side blob download, filename like `records-YYYY-MM-DD.csv` | — |

## 21. Content & Tone Guidelines

- Sentence case everywhere; no exclamation marks.
- Titles ≤ 3 words; descriptions one short clause.
- Buttons are verbs ("Add", "Export", "Confirm"); confirm dialogs state the consequence plainly ("This will permanently remove…").
- Empty states: encouraging title + hint description + action button ("Add your first record").
- Errors: short cause, no blame ("Amount is required").
- Toasts: past-tense success ("Record added") with optional Undo; info toasts for navigations.
- Currency symbol adapts to app settings; never hardcode a symbol in copy.

## 22. Performance & Rendering Rules

Next.js-specific:
1. **RSC by default** — pages and static sections stay Server Components; add `'use client'` only at interactive leaves (charts, tables, modals, search).
2. Dynamically import heavy client libraries when below the fold (`next/dynamic`; `ssr: false` for chart libraries that measure `window`).
3. Keep client bundles lean: named icon imports only; no barrel-file re-exports of heavy libraries from client components.
4. Use `next/font` (no render-blocking font requests).
5. Images via `next/image` when real images are used (initials avatars need none).
6. Memoize expensive derived data (`useMemo`) in list/chart components; keep context values stable via `useMemo` — or split contexts if profiling shows churn.
7. Avoid hydration mismatches: anything reading `localStorage`, time, or random values renders after mount (`useEffect`) or is suppressed until resolved.

Plain React equivalents: route-level `React.lazy` code-splitting for pages; same memoization and hydration rules.

## 23. Do / Don't Checklist

**Do**
- Keep pages as Server Components (Next.js) and push interactivity to leaf client components.
- Use semantic color only for its meaning (green=money-in, red=money-out) via shared token maps/recipes.
- Provide light+dark variants for every surface; test both modes.
- Pair destructive actions with a ConfirmDialog AND an undo toast.
- Show skeletons that mirror final layout during loads ≥ ~300ms.
- Keep all money values tabular-numeral, right-aligned in tables.
- Put filters/sort/page state in URL search params for shareable list views.
- Give icon buttons labels; give dialogs Esc + scrim-click close.
- Define tokens once (Tailwind config / lib constants) and reference them everywhere.

**Don't**
- Don't use pure black (`#000`) backgrounds or pure white text in dark mode.
- Don't introduce new accent colors per feature — reuse the §4 token set.
- Don't hardcode hex values or shadow strings inside components — extend `tailwind.config.ts` instead.
- Don't mix routing systems in the same codebase.
- Don't animate layout-critical properties slowly (>500ms entrances).
- Don't put long paragraphs in modals; keep descriptions to one line.
- Don't stack more than 4 toasts or 2 open layers of overlays.
- Don't hide sorting/filter affordances behind hover-only interactions.
- Don't read browser-only APIs during server render.

---

*Design system specification for React / Next.js projects. Version 1.0.*









