# EnvisionStudio Project Management Dashboard — Implementation Plan

**Status:** Initial application source is implemented; dependency install, line-limit, lint, TypeScript and Webpack production build checks pass. Database behavior, fixture import, browser review and deployment remain unverified.
**Assessment source:** locally supplied EnvisionStudio Web Developer Practical Assessment; the brief is not reproduced in this source repository.
**Selected stack:** Next.js App Router, TypeScript, Tailwind CSS, MongoDB Atlas, Mongoose.
**Design direction:** dark creative-agency workspace, restrained violet accent, extra-small rounded corners.

**Reading guide:** [Documentation index](./docs/README.md) · [Assessment mapping](./docs/assessment-mapping.md) · [Architecture and decisions](./docs/architecture.md) · [API and data contract](./docs/api-and-data.md) · [UX and handoff](./docs/ux-and-handoff.md) · [Operations and verification](./docs/operations.md). This document remains the master specification; focused pages distinguish implemented source from behavior that still needs verification.

## 1. Outcome and scope

Build a publicly accessible, responsive full-stack agency dashboard where a reviewer can inspect and manage projects and their tasks. The frontend must use the backend API for every application data operation; data must survive refreshes and deployments. The evaluator's provided mock data must be imported into MongoDB before the first reviewer visits.

### Assessment traceability

| Requirement | Current source implementation | Acceptance / verification |
| --- | --- | --- |
| Project list | `/projects` table on desktop, cards on small screens, paginated when needed | All projects and statuses accessible across pages |
| Filter by status | All plus the project statuses, via API query; examples are Active / Completed / On Hold | Results match selected status; All restores all |
| Create project | Project form | Title, description, status, deadline persist |
| Edit project | Main project entry opens a prefilled edit form; detail includes an Edit action | Changes persist and appear in list/detail |
| Delete project | Confirmation dialog with project and task-deletion consequences | Confirm removes project and tasks; cancel changes nothing |
| Project details | `/projects/[id]` | Full details and related tasks |
| Task management | Inline task list and create/edit dialogs | Create, edit, delete and toggle complete/incomplete persist |
| Summary | `/` | Accurate total/active project and completed/pending task counts |
| Backend | Next.js REST route handlers and Mongoose | Project and project-scoped task CRUD via real DB |
| Seed | Explicit import script | Provided data imported before launch; rerun is safe |
| UX | Responsive, loading/error/empty states | Usable across desktop/mobile and keyboard |
| Submission | Public URL, repository, README, submission form | All supplied and checked |

The brief says clicking a project opens an edit form and also requires a detail view. Make the project name a labelled button that opens its populated edit form; provide a separate explicit **View details** link for the dedicated page, with an Edit action there as well. Use real buttons/links rather than a clickable table row with nested controls. Apply the same distinction on desktop and mobile. This directly supports both flows and remains keyboard accessible.

**Preferred/optional:** dark theme is preferred; a walkthrough video of at most three minutes is optional but recommended. Authentication, roles, charts, time tracking, search, team features and file uploads are not requirements.

**Open inputs:** the assessment's linked Google Doc was inaccessible during research, but the fixture was later supplied locally as `data/assessment-mock.json`. It contains 10 projects and 20 tasks in separate top-level arrays and has been mapped; database import and post-import count checks remain open. The brief states 9 July 2026, 5:00 PM IST, which has passed as of 28 October 2026; obtain the current deadline and submission form link from the assessor. Do not misrepresent invented data as the supplied data.

The supplied fixture has been compared with the models and validation limits. Projects use `id`, `title`, `description`, `status` and date-only `deadline`; tasks use `id`, `projectId`, `title`, `description` and `status`. The adapter joins every task to its project, preserves descriptions and source statuses, and derives the required completion boolean from `Completed`. The illustrated diagrams are simplified and do not enumerate every fixture field. Verify stored counts and relationships after the database import.

## 2. Visual design and UX

### Reference images and rationale

These links are inspiration references, not assets to copy or embed in the product:

1. [Ronas IT project-management case study](https://ronasit.com/cases/saas-management-case/) — see the **all projects**, **new task panels**, **dashboard**, and **UI kit** images. Use its coherent task and project workflows, compact navigation and consistent spacing as inspiration.
2. [Yowk project management dashboard](https://dribbble.com/shots/27604088-Yowk-co-Project-Management-Dashboard) — see the main dashboard image for information hierarchy and dark summary panels.
3. [One Admin dark dashboard](https://raselhossain.dev/projects/one-admin-dark-theme-admin-dashboard) — see the main screenshot for sidebar and dense data-table inspiration.

Create an original layout tailored to the assessment. Avoid presenting features from reference products (collaboration, charts, inbox, avatars or time tracking) as functional features unless actually built.

### Visual tokens

| Token | Proposed value | Use |
| --- | --- | --- |
| `--bg` | `#0C0D10` | Main canvas |
| `--sidebar` | `#101116` | Navigation |
| `--surface` | `#17191F` | Cards, dialogs |
| `--surface-hover` | `#20232B` | Hovered rows/controls |
| `--border` | `#2A2D36` | Dividers and control outlines |
| `--text` | `#F1F2F5` | Primary text |
| `--muted` | `#A9ADB8` | Supporting text |
| `--accent` | `#A99BFF` | Focus, selected nav and accent text |
| `--accent-button` | `#A99BFF` | Primary button background with dark label |
| `--success` / `--warning` / `--danger` | green / amber / red | Status or destructive feedback, paired with text |
| `--radius` | `4px` | Panels, buttons, fields and dialogs |

Treat tokens as starting values; check every actual foreground/background pair for accessible contrast, including hover, focus, status text and button labels. Use at least 4.5:1 for normal text, 3:1 for large text and applicable UI indicators. Do not communicate status by color alone. See [WCAG contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) and [use of color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color).

Use Inter with a system sans fallback, roughly 14–16px body text, 24–28px page titles, tabular numerals for counts, and a 4/8px spacing scale. Sidebar ~240px at desktop; content max-width ~1440px; four summary cards at wide widths, two or one at narrower widths. Refine dimensions with browser testing, not rigid device assumptions.

### Screen wireframes

```text
Desktop dashboard
┌──────────────────┬────────────────────────────────────────────────────┐
│ Envision         │ Dashboard                         [+ New project]  │
│                  │ Overview of your agency's work                    │
│ ● Dashboard      │ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ │
│   Projects       │ │ Projects│ │ Active  │ │ Done    │ │ Pending │ │
│                  │ │   12    │ │    5    │ │   24    │ │   11    │ │
│                  │ └─────────┘ └─────────┘ └─────────┘ └─────────┘ │
│                  │ Recent projects                    View all →     │
│                  │ Project             Status        Deadline        │
│                  │ Brand website       Active        24 Nov 2026     │
│                  │ [Edit project]                    [View details]  │
└──────────────────┴────────────────────────────────────────────────────┘

Project details
Projects / Brand website                          [Edit] [Delete]
Brand website                         [Active]   Deadline: 24 Nov 2026
Project description…
Tasks                                              [+ Add task]
☐ Prepare discovery notes                            [Edit] [Delete]
☑ Approve project brief                              [Edit] [Delete]
```

Wireframe numbers, names and dates are illustration only, never presented as real live data. Mobile uses a menu button and drawer, stacked cards, wrapped headings and full-width or appropriately sized form controls. Keep project/task actions available without hover; avoid horizontal page overflow.

### Interaction and accessibility requirements

- Use semantic headings, landmarks, links, buttons, form labels and accessible dialog primitives. Dialogs trap and restore focus; Escape closes non-submitting dialogs. Checkboxes and filters work with keyboard and screen readers.
- Use a visible focus ring, sufficient contrast, reduced-motion support, and descriptive labels for icon-only controls. Do not rely on tooltips to expose essential actions.
- Show skeletons for initial loads, inline saving indicators and disabled duplicate submissions, actionable error messages with retry, and success feedback. Preserve form input on save failure.
- Distinguish no projects from no results for the selected status. Show “Add project” or “Clear filter” as appropriate; for no tasks, show “Add task”.
- Confirm project deletion explicitly, including deletion of its tasks. Task deletion also gets a confirmation for consistency. A failed delete leaves the current view intact.
- Date-only deadlines display as calendar dates, without timezone shifts. Show full text on detail view; avoid losing long names or descriptions through truncation without access to full content.
- Ensure dashboard counts update after successful mutations; do not claim updates from speculative values if a request failed.

## 3. System architecture

![Proposed system: browser calls the Next.js API, validation and services, backed by MongoDB; seed CLI connects separately](./docs/diagrams/system-architecture-illustrated.png)

The browser calls REST handlers over HTTPS; request guards and services lead to MongoDB. An operator-run seed CLI separately imports the supplied data directly into MongoDB.

- Single deployable Next.js application; Route Handlers are the backend and use Node.js runtime. No custom Express server.
- Frontend uses same-origin REST `fetch` calls for reads and writes, including summary. Shared validation/types are browser-safe; DB, environment and service modules are server-only. Services receive explicit validated inputs and return minimal plain DTOs.
- Server handlers parse/validate HTTP, invoke services and translate errors. Services own business rules and project/task scope. Models own database schema and indexes. UI is split into route shells, reusable components and feature-specific hooks.
- The CLI must not import modules marked `server-only` directly: the package enforces a Next.js module boundary and is not a general Node guard. Keep database/models in a Node-only core, imported through a `server-only` adapter for web code and directly by the trusted seed CLI. Enforce the import boundary with lint rules: client modules and browser-safe shared modules may not import the core, directly or transitively; check the dependency graph/build as well. A `server-only` wrapper alone cannot prevent a direct core import. Test the CLI separately and keep secrets out of shared/browser modules.
- Use modular monolith, separation of concerns, least privilege, explicit contracts, one source of truth, idempotent setup and observability; avoid microservices or abstractions with no demonstrated need.
- Database deploys separately on Atlas; do not put MongoDB credentials in frontend bundles or `NEXT_PUBLIC_*` variables. [Mongoose Next.js guidance](https://mongoosejs.com/docs/nextjs.html) notes Mongoose requires the Node.js runtime, not Edge.

## 4. Libraries and choices

The first implementation uses the packages listed below; package-lock.json is generated and synchronized. Dependency install completed and npm reported zero known vulnerabilities at install time. A fresh production-dependency audit could not reach the npm registry from this environment and must be repeated in connected CI. Line-limit, lint, Next route type generation, TypeScript and optimized Webpack production build checks pass. Turbopack could not start its PostCSS worker here. The production build passed with filesystem write access; sandboxed execution may return `EPERM` while creating `.next` directories. Database behavior remains unverified. Test libraries and shadcn/ui were considered but intentionally not added; the app uses native dialog elements and focused custom components.

| Package/tool | Purpose | Decision |
| --- | --- | --- |
| `next`, `react`, `react-dom`, `typescript` | App Router, UI, route handlers and typed code | Core, compatible stable versions |
| `tailwindcss`, `@tailwindcss/postcss` | CSS pipeline and styling foundation | Integrated; current screens use local CSS tokens and styles |
| `mongoose` | Schema models, connections, MongoDB access | Required MongoDB choice in the brief |
| `zod` | Explicit input and query validation | Validate on server; shared with forms where suitable |
| `react-hook-form`, `@hookform/resolvers` | Form state and field errors | Project and task forms |
| `@tanstack/react-query` | API loading/error/mutation state and cache invalidation | One client-side source of API data |
| `lucide-react` | Consistent icons | Use labels alongside icons |
| `server-only` | Catch accidental browser imports | Web-only server adapters and services; not CLI-imported core modules |
| `tsx` and `@next/env` | Run TypeScript seed script and load local environment | Development tooling; never expose seed over HTTP |
| `eslint`, `eslint-config-next`, `@eslint/eslintrc` | Linting and import-boundary rules | Configured; not run |
| `scripts/check-line-limits.mjs` | Source/config physical line guard | Runs via the package script; verify before each handoff |
| `vitest`, `@playwright/test` | Focused unit/integration and end-to-end tests | Not installed; add only when test work is requested and provision an isolated DB |

Use native `fetch`, native date input and `Intl`; no Axios, Redux, charting library or extra HTTP server by default. Lock dependency versions in the lockfile; review peer compatibility and Node requirements when installing. Keep the package list small and add libraries only for a concrete need. [React Hook Form integration](https://react-hook-form.com/integrations); [Next.js testing guide](https://nextjs.org/docs/app/guides/testing).

## 5. Repository structure

Current source follows a compact, feature-oriented structure. The planned larger feature folders below are not required for this assessment and should be introduced only if the current components grow beyond their responsibilities.

```text
src/
  app/
    layout.tsx                      # shared shell and providers
    page.tsx                        # dashboard
    projects/page.tsx               # project list
    projects/[projectId]/page.tsx   # project detail
    api/
      dashboard/route.ts
      projects/route.ts
      projects/[projectId]/route.ts
      projects/[projectId]/tasks/route.ts
      projects/[projectId]/tasks/[taskId]/route.ts
    globals.css
    not-found.tsx
  components/
    layout/                         # sidebar, mobile navigation, page header
    ui/                             # selected reusable accessible primitives
    feedback/                       # skeletons, error and empty states
  features/
    dashboard/                      # dashboard UI + query hooks
    projects/                       # project list, form, detail, query hooks
    tasks/                          # task list, form, query hooks
  lib/
    client/                         # fetch client, query client and query keys
    server/                         # server-only web adapters, services, guards
    db/                             # Node-only db/models, used by server and CLI
    shared/                         # API DTOs, constants, Zod schemas, date helpers
scripts/
  seed.ts                           # DB setup, transactions, and import manifest
  seed-fixture.ts                   # strict fixture validation and normalization
data/
  assessment-mock.json              # supplied fixture if permitted to commit
tests/
  unit/ integration/ e2e/
docs/
  README.md                         # documentation index and current status
  architecture.md                  # decisions and data lifecycle
  api-and-data.md                  # planned contract
  ux-and-handoff.md                # screen flows and design references
  operations.md                    # delivery and verification checklist
.env.example                        # variable names only, no credentials
README.md
```

Structure is a target, not a requirement to create empty files. Keep code colocated and avoid a large generic component framework. `data/` holds the authentic mock data only if its sharing terms allow it. If not, document how to supply it locally and to the deployment operator.

## 6. Data model and rules

### Project

| Field | Type | Proposed rule |
| --- | --- | --- |
| `_id` | MongoDB ObjectId | Server generated |
| `title` | string | Trim; required, 1–120 characters |
| `description` | string | Trim; up to 5000 characters; empty string is allowed |
| `status` | string | Trim; 1–40 characters; known values are offered, but fixture/custom values are retained |
| `deadline` | string | `YYYY-MM-DD`, a validated calendar date, not an instant |
| `createdAt`, `updatedAt` | Date | Server-managed timestamps |
| `seedKey` | string, optional | Stable source identifier for idempotent import; never accepted from API |
| `taskWriteVersion` | integer | Internal concurrency field; default zero; never accepted from API or returned in DTOs |

### Task

| Field | Type | Proposed rule |
| --- | --- | --- |
| `_id` | MongoDB ObjectId | Server generated |
| `projectId` | ObjectId reference to Project | Required, immutable through task update |
| `title` | string | Trim; required, 1–200 characters; adapt to provided fixture |
| `description` | string | Trim; optional, maximum 5,000 characters; preserve fixture detail |
| `status` | string | Preserve source status (for example Pending, In Progress, Completed); update with completion toggles |
| `completed` | boolean | Defaults to `false` |
| `createdAt`, `updatedAt` | Date | Server-managed timestamps |
| `seedKey` | string, optional | Stable seed identity; never accepted from API |

The brief does not define task fields or fixed status values; the supplied fixture provides descriptions and the statuses Pending, In Progress and Completed. API writes accept a task description and completion boolean, while source status is retained and synchronized when completion changes. Pending and In Progress both have `completed: false`; Completed maps to `true`. Project status remains independent of task completion. Date-only storage matches the supplied `YYYY-MM-DD` deadlines and avoids UTC/local day shifts.

### Deletion and concurrent operations

Delete a project together with its tasks; communicate this in the confirmation. In one MongoDB transaction, delete the project by ID, check whether it existed, then `deleteMany` its tasks and commit. To prevent a concurrent task create from producing an orphan, task creation must also run in a transaction and perform a conditional write to the parent project (increment a dedicated server-owned `taskWriteVersion`) before inserting the task; deletion writes the same project document, so conflicting transactions retry or fail and recheck project existence. Suppress automatic project `updatedAt` changes for this internal write so creating a task does not misleadingly appear to edit project details. Task updates/deletes are always scoped to both `projectId` and `taskId`. The seed importer must use the same parent-write transaction for every task insertion, or execute only with application writes disabled; it must never recreate a deleted parent/task during ordinary reruns without an explicit recovery decision. Transaction callbacks can retry: perform only DB operations within them, pass the session to every operation, execute sequentially (no `Promise.all`), and keep external side effects outside. Bound retries and map exhausted conflicts to a retryable error. Test create-versus-delete concurrency on a replica-set deployment. Mongoose `ref` alone does not enforce foreign keys. Verify transactions are supported by the chosen Atlas tier and local/test replica set before implementing; if unavailable, select and document a tested alternative lifecycle design instead of claiming atomicity. See [Mongoose transaction guidance](https://mongoosejs.com/docs/transactions.html) and [MongoDB write conflicts](https://www.mongodb.com/docs/manual/core/transactions-production-consideration/).

## 7. API contract

Same-origin JSON under `/api`. DTOs use string `id` and `projectId`, ISO timestamp strings and date-only `deadline`; never expose MongoDB internal fields or `seedKey`. Set `Cache-Control: no-store` on dynamic API responses. Query parameters and JSON bodies are parsed with strict schemas; do not pass arbitrary request objects as MongoDB filters or updates.

| Method | Route | Behavior | Success |
| --- | --- | --- | --- |
| GET | `/api/projects?status=active&limit=25&cursor=...` | Page of projects, optionally status filtered | `200` |
| POST | `/api/projects` | Create project | `201` |
| GET | `/api/projects/statuses` | Built-in and stored status values | `200` |
| GET | `/api/projects/:projectId` | Project detail | `200` |
| PATCH | `/api/projects/:projectId` | Partial project update | `200` |
| DELETE | `/api/projects/:projectId` | Delete project and tasks | `204` |
| GET | `/api/projects/:projectId/tasks?limit=25&cursor=...` | Page of tasks for existing project | `200` |
| POST | `/api/projects/:projectId/tasks` | Create task in existing project | `201` |
| GET | `/api/projects/:projectId/tasks/:taskId` | Read project-scoped task | `200` |
| PATCH | `/api/projects/:projectId/tasks/:taskId` | Edit title and/or completion | `200` |
| DELETE | `/api/projects/:projectId/tasks/:taskId` | Delete project-scoped task | `204` |
| GET | `/api/dashboard` | Four summary counts: total/active projects and completed/pending tasks | `200` |

Use cursor pagination for both project and task lists so every record remains accessible as the dataset grows. Accept `limit` (default 25, maximum 100) and a base64url cursor; return `{ "data": [...], "page": { "nextCursor": string | null } }`. Fetch `limit + 1` records to determine whether another page exists. Provide labelled Next/Previous controls in the UI; maintain previous cursor history per list and reset it when the filter changes. The cursor carries the last returned immutable `createdAt` and `_id` sort keys plus the active status filter or project scope; validate its format and decoded values server-side, reject mismatches with `400`, and never use client-supplied objects as database filters. It is not signed and is not a security credential. Sort projects and tasks by `createdAt` descending and `_id` descending so new records appear on the first page; use corresponding lexicographic keyset predicates and compound indexes. Inserts or deletes during browsing may change what appears between pages; provide refresh and do not claim a snapshot. The dashboard independently requests metrics from `/api/dashboard` and five recent projects from `/api/projects?limit=5`, rendering each section as its response arrives. Dynamic API responses use no-store; verify framework-level caching and prerender behavior at build/runtime.

Example request and response:

```http
POST /api/projects
Content-Type: application/json

{"title":"Brand website","description":"Design and build the site.","status":"active","deadline":"2026-11-24"}
```

```json
{
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "title": "Brand website",
    "description": "Design and build the site.",
    "status": "active",
    "deadline": "2026-11-24",
    "createdAt": "2026-10-27T10:00:00.000Z",
    "updatedAt": "2026-10-27T10:00:00.000Z"
  }
}
```

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Check the highlighted fields.", "fields": { "title": "Title is required." } } }
```

The current handler returns `200/201/204` on success; `400` for malformed JSON, ID, cursor, query or validation failure; `403` for missing/unapproved mutation Origin; `404` for a missing project or task outside its project; `413` for an oversized body; `415` for unsupported content type; `500` for unexpected errors; and `503` for MongoDB selection/network failures or unsupported transactions. The app does not currently implement `429`; configure a deployment-edge rate limit before public release. Never return stack traces, connection strings or raw database errors. PATCH schemas reject empty bodies and unknown keys; validate ObjectIds before database calls. Document exact contract and examples in README/API documentation. Next.js may generate `405`/`OPTIONS` responses itself: do not promise that framework-generated responses use our JSON envelope; the client tolerates an empty or non-JSON response as a generic failure.

## 8. Queries, indexes and performance

| Operation | Query strategy | Initial index |
| --- | --- | --- |
| Project list | `find({status?}).sort({createdAt:-1,_id:-1}).limit(limit+1).lean()`, then map a public DTO | `{createdAt:-1,_id:-1}` and `{status:1,createdAt:-1,_id:-1}` |
| Project detail | `findById` and DTO projection | Built-in `_id` |
| Project tasks | `find({projectId}).sort({createdAt:-1,_id:-1}).limit(limit+1).lean()`, then map a public DTO | `{projectId:1,createdAt:-1,_id:-1}` |
| Task mutation | Match both `_id` and `projectId` | Built-in `_id` is sufficient to locate one, then check scope |
| Counts | `countDocuments` for project totals and active projects, plus completed/pending task counts | Task `{completed:1}` supports task counts; status regex may scan, measure before optimizing |
| Seed lookup | `seedKey` unique for seeded documents | Unique partial index on string-valued `seedKey` per collection |

Use `Promise.all` for independent summary queries and bounded result projections; calculate counts in the database, not by transferring all records. Per-request count queries are sufficient for assessment-scale data; no precomputed counters or cache until measurements justify them. Queries are not globally snapshot-consistent if mutations happen during summary calculation: after mutations refetch; document this small concurrency limitation. Validate index use with `explain('executionStats')` and realistic data, and remove redundant indexes after measurement. Each extra index adds write/storage cost. Establish indexes through a controlled deployment step rather than automatic creation on every serverless invocation.

Connection helper caches the **connection promise per warm runtime instance**, clears it on connection failure, sets bounded connection pool/server selection timeouts appropriate to the deployment, and avoids opening a new connection for each request. Production disables automatic index building; the operator-run seed command explicitly creates declared indexes during setup. Scaling creates multiple instances and pools; set conservative pool limits and monitor Atlas connection counts. Configure region close to the app. No large client libraries or images are needed for this data-focused interface; use server-rendered shell and client components only for interactive portions, with loading/error feedback.

React Query keys: `['dashboard', 'metrics']`, `['projects', status, cursor, limit]` (dashboard recent rows use `['projects', '', null, 5]`), `['project', id]`, and `['tasks', id, cursor, limit]`. After project mutations invalidate all project-list pages, affected detail and dashboard metrics; after task mutations invalidate all pages of that project's tasks and dashboard metrics. Reset pagination to the first page when a mutation could change ordering or page membership, so recently created/deleted records are not missed. Await success before success feedback and preserve data if a mutation fails. Send an explicit desired boolean when toggling a task rather than a server-side invert, and prevent simultaneous duplicate submits. Avoid automatic retries of non-idempotent POST mutations: if a network response is lost, tell the user the outcome is unknown and refetch before retrying to reduce duplicates. PATCH uses last-write-wins, so simultaneous edits can overwrite one another; document this demo limitation and add version-based conflict detection if collaborative use is needed. Keep `staleTime` modest; refetch on focus so other reviewers' changes eventually appear. No claim of real-time collaboration.

## 9. Security and public-demo boundaries

**Explicit threat model:** the assessment requires a public, usable CRUD demo and specifies no accounts. Default design is an unauthenticated shared demo: anyone who can reach its API can read, create, change or delete its records. Rate limiting, input validation and HTTPS reduce abuse but **do not provide authorization or protect data from intentional changes**. Use only non-sensitive mock data; isolate a dedicated demo DB, limit privileges and cost exposure, and provide a documented operator recovery/reseed process. Confirm with the assessor if restricted access is acceptable before introducing login. For real agency data, add authenticated sessions and server-side authorization on every read/write and tenant scope; do not ship this public-demo model as a private product.

- Enforce HTTPS at hosting layer; MongoDB TLS, separate database user with only necessary access, credentials in deployment secret manager, no credentials in repo/logs. Use separate dev, test and demo databases.
- Atlas network access list: restrict to fixed egress/private networking if the selected hosting plan supports it. Serverless hosts may lack fixed outbound IPs; if broad access is necessary, document the exposure and rely on strong database authentication/TLS/least privilege, never treat IP rules as app authentication. Verify actual host capabilities. [Atlas connection documentation](https://www.mongodb.com/docs/atlas/troubleshoot-connection/).
- Validate every body, query and ID server-side using strict Zod schemas; allowlist fields and operations, reject unexpected object operators and extra fields, limit body bytes while reading (not just `Content-Length`), use content-type checks and reasonable string length limits. Sanitize logs; never log full body or secrets. Render user content as plain text; avoid `dangerouslySetInnerHTML`.
- Use same-origin browser calls and do not enable permissive CORS. Current writes require an Origin header and compare it against APP_ALLOWED_ORIGINS, with localhost:3000 as the development default; missing or disallowed origins are rejected. Do not derive trusted origins from unvalidated Host headers. Origin/CORS checks alone are **not authentication** and can be forged by non-browser clients. The seed CLI connects directly to MongoDB. If cookie authentication is introduced, design CSRF defenses, secure HttpOnly/SameSite cookies and authorization checks explicitly.
- **Not implemented:** shared rate limiting. Before public release, apply a platform-backed limit for writes and expensive reads with 429 and retry guidance. Do not rely on in-memory counters in serverless instances. Until then, use non-sensitive data and document the unmitigated risk. Bounded query sizes and request bodies are implemented.
- Current Next config sets nosniff, Referrer-Policy, frame denial, DNS prefetch off and a restrictive Permissions-Policy; production adds HSTS. A Content Security Policy has not been configured or browser-tested.
- Review dependencies and lockfile; run audit and fix applicable vulnerabilities. Avoid public seed/reset/admin endpoints. Use least-privilege hosting access and do not expose internal paths, stack traces or secrets in error responses. See [OWASP REST security](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html).

## 10. Seeding and environments

1. Obtain and inspect the actual mock file/document. Record source format, statuses, dates, task ownership, IDs and any extra fields. Confirm whether redistribution is permitted.
2. Add a documented adapter that validates the complete fixture before writing anything. Map stable project/task seed keys from source IDs and preserve relationships. If source IDs do not exist, generate deterministic keys from a checksum-verified, immutable source and recorded positions; do not assume titles are unique. Flag missing fields or incompatible dates/statuses rather than silently dropping or fabricating values; agree and document any mapping before importing.
3. Run an explicit operator CLI with an environment-specific MongoDB URI. Complete and verify initial import before exposing the demo to writes; if interrupted, keep writes disabled until recovery or resume is complete, so a resumed import cannot recreate reviewer-deleted records. The initial import uses `$setOnInsert` and a unique partial `seedKey` index so a retry after interruption does not overwrite edits. Record a durable import manifest (source checksum, stable keys, status and mappings) and resume only that incomplete import; ensure only one importer runs per database using an atomic manifest claim with safe stale-claim recovery. Task inserts must use the same project-integrity protocol described above. Once the manifest is complete, ordinary reruns are a no-op, including when a reviewer deleted seeded records. A separate explicit, guarded recovery operation may restore data, subject to operator confirmation and backup. Preflight collisions and invalid records; fail with actionable diagnostics and report inserted/skipped/failed counts. Do not infer stable identity solely from mutable content or array positions unless the fixture is immutable, versioned and checked by checksum.
4. Never seed automatically on every request, app startup, or deployment, and never use a destructive reset by default. If an operator needs to restore demo data, use a separate explicit documented procedure with environment checks and backup; do not run it automatically.
5. Provision the dedicated demo database, create indexes and run seed **before** sharing the public URL. Check every supplied record, relationship and count after deployment and refresh. This ensures the initial deployed state contains the provided data; because the demo is shared and editable, later reviewers may see previous reviewers' changes. Monitor and restore through the explicit recovery process when needed; do not claim each visitor gets a fresh copy. Use separate isolated database for tests, never the public demo.

Example configuration, values supplied privately:

```dotenv
MONGODB_URI=
APP_ALLOWED_ORIGINS=http://localhost:3000
```

`MONGODB_URI` is server-only; actual secret goes in `.env.local` or hosting secrets, not version control. Add rate-limiter variables only after selecting its provider. The supplied fixture is mapped but must still be imported and verified in the configured transaction-capable database; placeholder development data does not satisfy the brief.

## 11. Error handling and observability

- Shared API error mapper returns stable, safe error codes and a request ID; logs include request ID, operation, status, duration and sanitized error category. Avoid personal data and raw request bodies.
- Make application-generated failures predictable JSON; `204` is an empty success and framework-generated responses can be empty/non-JSON. Distinguish missing record from temporary DB failure and show understandable retry guidance.
- Log DB connection failures and mutation failures in hosting logs; monitor error rate, latency, rate limits and Atlas connection count using the chosen provider's available tools. Avoid adding a monitoring service without a need.
- Provide an operator checklist for database connectivity, secrets, seed status and rollback/redeploy. Do not provide an unauthenticated endpoint that dumps secrets or detailed health information.

## 12. Test and quality strategy

Use a separate test database and replica set where transaction tests require it. Never aim destructive automated tests at the public demo.

1. **Static:** lint, TypeScript checks and production build. Verify no secrets or `NEXT_PUBLIC_` database URI in repo or client bundle.
2. **Validation/API integration:** create/edit/delete projects; status filtering and invalid status; project-scoped task CRUD; project and task pagination across multiple pages, ties and filter resets; malformed IDs/JSON/cursors; unknown fields; invalid dates; missing project and wrong-project task; request limits; error response shape.
3. **Persistence & counts:** mutations survive refresh and a fresh client; totals and active/completed/pending counts match database after adds, edits, toggles and deletes; no orphan tasks after deletion.
4. **Concurrency:** exercise concurrent project deletion and task creation against the real replica-set transaction behavior; test transaction conflicts/retries, concurrent seed claims, interrupted imports and completed seed reruns after edits and deletions. Test unknown POST outcomes and task toggles.
5. **End-to-end:** Playwright covers create/filter/edit/delete project, task add/edit/toggle/delete, confirmation cancel, navigation, refresh and loading/error states. Confirm seeded initial data in a clean isolated environment.
6. **UI/accessibility:** keyboard-only navigation, focus management, labels, status text, contrast checks, narrow and wide viewports, long text, empty data and reduced motion. Manually review browser layout and use automated accessibility checks where practical.
7. **Deployment smoke:** in the designated demo environment, verify URL, database connectivity, seeded data, CRUD, persistence and restoration procedure. Coordinate test records so live seed data is not unintentionally deleted.

## 13. Delivery, deployment and documentation

- **Local:** install a supported Node LTS compatible with the chosen Next.js version, `npm ci`, copy `.env.example`, configure an isolated MongoDB database, run documented index/seed commands, then `npm run dev`. Scripts are defined during implementation; README must reflect actual commands.
- **CI:** run install from lockfile, lint, type check, focused tests and production build. Run DB integration/e2e in CI only with a safely provisioned isolated replica set; document if unavailable.
- **Hosting:** connect GitHub repository to Vercel (or suitable Node hosting), set server-only environment variables, configure Atlas connectivity and HTTPS, run controlled index and seed commands, test production-like build, and visit the public URL. Prefer separate preview DB; previews must not mutate production demo data.
- **README:** overview/screens, prerequisites, local install, environment values and safety, database/index/seed instructions, available npm scripts, architecture and technology rationale, concise endpoint table and examples, deployment, testing, known limitations, challenges and honest AI-use/validation statement. Include public app URL and optional video if available. Never invent challenges or claim tests were performed.
- **Architecture documentation:** tradeoffs, lifecycle/deletion strategy, date semantics, indexes, security/public-demo limitation, operational recovery and unresolved decisions. Document the fixture's source and transformation. Update the existing documentation set when code and verified behavior change.
- **Submission:** complete repo, public URL, optional ≤3-minute walkthrough and form confirmation. Confirm the form link and current deadline with the assessor; they are unresolved in the supplied document.

## 14. Implementation sequence and definition of done

| Step | Status | Current evidence / remaining work |
| --- | --- | --- |
| Inspect assessment and choose schema/seed mapping | Fixture reviewed | Written requirements and the supplied fixture have been reviewed; the 10-project/20-task mapping passes local normalization. Database import verification remains open. |
| Scaffold Next.js, TypeScript, Tailwind, theme and environment | Verified | Package/configuration and responsive UI source exist; install, lint, typecheck and Webpack build pass. Browser review is pending. |
| Implement Mongo connection, models, indexes, validation, services and REST | Source present | Project/task routes, DTOs, query guards and transaction logic exist; static checks pass, but DB behavior is unverified. |
| Implement seed importer | Partial | Strict adapter and checksum manifest exist. Actual fixture maps and passes local normalization; DB import counts, relationships and reruns remain unverified. |
| Build dashboard, list, details and task forms | Source present | Database-backed API client, loading/error/empty states and CRUD UI exist; no browser exercise has been performed. |
| Harden and validate public API | Partial | Origin guard, body/query limits, safe errors and headers exist. Rate limiting/authentication are absent; transaction and security checks remain. |
| Documentation, repository, deployment and submission | Partial | README and focused architecture docs exist; line-limit, filter tests, lint, TypeScript and production build pass. No Git repository, public deployment, optional walkthrough or submission was completed. |

Next work is to connect an isolated transaction-capable MongoDB, import and verify the supplied fixture, validate CRUD behavior, review the UI, and only then prepare hosting and submission. Static checks and the Webpack production build have passed; do not claim database import, browser review or deployment complete until verified.

**Done means:** every assessment feature passes with persistent database data; the provided dataset is verified in the initial deployed state before sharing; desktop/mobile, loading/errors and keyboard flows work; public demo limitations are documented; tests and build pass; a reviewer can run locally and access the deployed app and repository. No claim of deployment, successful tests, dataset import or submission until each is actually verified.

## 15. Reference documentation

- [Next.js App Router](https://nextjs.org/docs/app/getting-started) and [backend-for-frontend guide](https://nextjs.org/docs/app/guides/backend-for-frontend)
- [Mongoose with Next.js](https://mongoosejs.com/docs/nextjs.html)
- [React Hook Form + Zod](https://react-hook-form.com/integrations)
- [OWASP REST security](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html)
- [WCAG contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) and [use of color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color)
- [Carbon loading](https://www.carbondesignsystem.com/building-blocks/core/patterns/loading) and [empty states](https://www.carbondesignsystem.com/building-blocks/core/patterns/empty-states)
