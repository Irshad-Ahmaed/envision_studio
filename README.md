# Envision Studio Project Dashboard

A project and task workspace for the EnvisionStudio Web Developer Practical Assessment.

> **Implementation status:** the application source is present; dependencies are installed, lint and TypeScript checks pass, and the Webpack production build passes. The supplied fixture is mapped in the adapter, but database import, browser review and deployment are not verified. The demo has no authentication or authorization; anyone who reaches a public instance can change its records. Use non-sensitive data only.

## Stack

- Next.js App Router, React and TypeScript for pages and REST Route Handlers.
- Tailwind CSS is included; the current visual system uses project CSS tokens and responsive CSS.
- MongoDB Atlas with Mongoose for persistent Project and Task models.
- Zod and React Hook Form for validated project/task input; React Query for API data and refresh states.

## Features in this implementation

- Dashboard metrics and recent projects load independently through separate same-origin API requests.
- Responsive project list with status filter, cursor pagination, create/edit form, detail route and delete confirmation.
- Project-scoped task list with pagination, add/edit/delete and completion toggle.
- API-backed loading, empty, validation and error states.
- MongoDB models, API input validation, project/task scoping, request-size limit and explicit seed CLI.

These features are implemented in source but still need database and browser verification. See [assessment mapping](./docs/assessment-mapping.md), [architecture](./docs/architecture.md), [API/data contract](./docs/api-and-data.md), [UX handoff](./docs/ux-and-handoff.md) and [operations](./docs/operations.md).

## Requirements

- Node.js 20.19 or newer (required by the resolved MongoDB/Mongoose drivers; Node 24 LTS also works).
- A transaction-capable MongoDB deployment: MongoDB Atlas or a local replica set. A standalone local MongoDB server does not support the transactions used by task creation and project deletion.
- The JSON mock fixture provided by the assessor.

## Local setup

1. Install the locked dependency versions with `npm ci`.
2. Copy `.env.example` to `.env.local` and set `MONGODB_URI` to a development database. Never expose it through a `NEXT_PUBLIC_` variable or commit `.env.local`.
3. The supplied fixture is at `data/assessment-mock.json`. `scripts/seed-fixture.ts` validates project and task fields and joins the fixture's top-level task records to projects by `projectId`; it also accepts nested task arrays. It preserves task descriptions/status and derives the completion flag from `status === "Completed"`. Unknown fields, invalid values, duplicate IDs or broken relationships stop the import before database writes. `scripts/seed.ts` handles database setup, transactions and the import manifest.
4. Run `npm run seed` to import the fixture into the configured database. The importer is idempotent for the same fixture checksum and will not overwrite user edits after a completed import.
5. Start with `npm run dev` and visit `http://localhost:3000`.

The adapter has been checked against the supplied 10-project, 20-task fixture. Dates must be real `YYYY-MM-DD` calendar dates; timestamps are not silently converted. Limits for future user-entered content remain application validation choices.

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `MONGODB_URI` | Yes | Server-only MongoDB connection string |
| `APP_ALLOWED_ORIGINS` | For browser writes | Comma-separated exact origins; set local and deployed origins |
| `SEED_FILE` | No | Fixture path; defaults to `./data/assessment-mock.json` |

## API summary

All endpoints are same-origin JSON under `/api`. List endpoints use `limit` (default 25, maximum 100) and an opaque `cursor`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET, POST | `/api/projects` | List/filter projects, create project |
| GET, PATCH, DELETE | `/api/projects/:projectId` | Read, update or delete project and its tasks |
| GET | `/api/projects/statuses` | Available project status values |
| GET, POST | `/api/projects/:projectId/tasks` | List or create tasks for a project |
| GET, PATCH, DELETE | `/api/projects/:projectId/tasks/:taskId` | Read, update or delete a task scoped to its project |
| GET | `/api/dashboard` | Four dashboard counts |

Project input fields: `title`, `description`, `status`, `deadline`. Status writes accept the built-in values or a status already present in stored/seeded projects. Task input fields: `title`, optional `description`, and `completed`; task `status` is derived when completion changes. Successful deletes return `204` with no response body. Errors use a safe `{ error: { code, message, requestId } }` shape.

The dashboard requests its four counts from `/api/dashboard` and its five most recent projects from `/api/projects?limit=5`. These React Query requests are independent, so each section renders when its own data arrives.

## Checks

Scripts include `npm run check:line-limits`, `npm run test:filters`, `npm run lint`, `npm run typecheck`, `npm run build` and `npm run seed`. The line-limit guard, focused status-filter tests, lint, TypeScript check and Webpack production build pass. Webpack is selected because Turbopack's PostCSS worker could not start in this restricted workspace. The production build completed when granted filesystem write access; sandboxed runs may return `EPERM` while Next creates `.next` output directories. Live database and browser checks have not run in this workspace. Database-backed routes need `MONGODB_URI`; project deletion and task creation use transactions, so use a transaction-capable replica set (Atlas is suitable).

## Deployment and known gaps

Deploy the Next.js Node runtime and MongoDB Atlas separately, configure environment secrets and `APP_ALLOWED_ORIGINS`, run the seed command to explicitly create indexes and seed the dedicated demo database, then verify the deployed URL and persistence before sharing it. Do not point test or preview environments at the public demo database.

### Assessment submission status

| Deliverable | Status |
| --- | --- |
| Public application URL | Not deployed yet |
| Source repository | [github.com/Irshad-Ahmaed/envision_studio](https://github.com/Irshad-Ahmaed/envision_studio) |
| Optional walkthrough video (3 minutes maximum) | Not recorded |

The local brief states a deadline of 9 July 2026 at 5:00 PM IST, which has passed, and refers to a submission form without including its URL. Confirm the current deadline and form with the assessor before submitting. The linked mock-data document was unavailable during initial research; the fixture was later supplied locally and mapped. Challenges included adapting the importer to the fixture's separate top-level task collection, getting dependencies through the approved network path, and using Webpack after Turbopack's PostCSS worker failed in this Windows environment.

Browser writes require an allowlisted Origin, which is a CSRF guard and not authentication; application-level rate limiting is not implemented. Configure rate limits at the hosting edge before public release. The unauthenticated demo is publicly writable, so use only non-sensitive data.

## AI use

Codex was used to analyze the assessment, plan the architecture, implement the application and prepare documentation. Validation performed: `npm run check:line-limits`, `npm run test:filters` (4 passing cases), `npm run lint`, `npm run typecheck` and `npm run build` all pass. The fixture adapter normalizes 10 projects and 20 tasks locally. Database import and persistence, browser/accessibility behavior, deployment and submission have not been verified. Review and understand the code before presenting it.
