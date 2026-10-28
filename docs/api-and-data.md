# API and data contract

**Status:** endpoint handlers and schemas are implemented; the supplied fixture passes local normalization. Database behavior and import results have not been verified. Route handlers are the source of truth; update this page when code changes.

## Conventions

- All endpoints are same-origin under /api. JSON writes require Content-Type application/json.
- Successful reads and writes return a data envelope. Deletes return 204 with no body. Data responses use Cache-Control: no-store.
- Errors return an error object with code, safe message and requestId. Validation errors can include field messages. Unexpected errors are logged by category and error type, without request bodies or secrets.
- Mutating requests require an Origin header matching APP_ALLOWED_ORIGINS. The default allowlist is localhost:3000. Configure deployed origins as exact origins without a trailing slash.
- An Origin check is a browser CSRF guard, not authentication: non-browser callers can forge the header. The app has no identity, authorization or application-level rate limiter.

## Endpoints

| Method | Path | Behavior |
| --- | --- | --- |
| GET | /api/dashboard | Four summary counts: total/active projects and completed/pending tasks |
| GET | /api/projects | Project page; optional status, limit and cursor |
| POST | /api/projects | Create a project; title, description, status and date-only deadline |
| GET | /api/projects/statuses | Built-in and currently stored status values |
| GET | /api/projects/:projectId | Read one project |
| PATCH | /api/projects/:projectId | Update one or more project fields |
| DELETE | /api/projects/:projectId | Delete project and its tasks in one transaction |
| GET | /api/projects/:projectId/tasks | Project-scoped task page; optional limit and cursor |
| POST | /api/projects/:projectId/tasks | Create a task in the project, transactionally coordinated with parent deletion |
| GET | /api/projects/:projectId/tasks/:taskId | Read a task only when it belongs to the given project |
| PATCH | /api/projects/:projectId/tasks/:taskId | Update task title, description and/or completed state within the project |
| DELETE | /api/projects/:projectId/tasks/:taskId | Delete a task only within the given project |

Project and task IDs must be valid MongoDB ObjectIds. Project/task input schemas reject unknown fields and invalid values. Project writes accept the built-in statuses (`active`, `completed`, `on_hold`) or a status already present in stored/seeded data; this preserves fixture-specific labels without letting API callers create an unbounded status vocabulary. The status filter groups case and separator variants (spaces, underscores and hyphens) into one option and matches those variants consistently. Bodies are streamed and limited to 16 KiB. Query keys must be recognized and cannot be repeated. Filtering by a status with no matching projects returns an empty page. The empty status filter means “all”; a real status named `all` remains filterable.

## Pagination and data shape

List pages default to 25 rows and allow 1–100 rows. Projects and tasks sort by createdAt descending then ID descending so newly created records appear on the first page. Each response is shaped as data plus page.nextCursor. Cursors are base64url-encoded sort keys and query scope; the server validates them and rejects scope mismatches. They are not signed or a security credential. Changing status resets the UI cursor history. Pagination is not a snapshot while concurrent writes occur.

Project DTO fields are id, title, description, status, deadline, createdAt and updatedAt. Task DTO fields are id, projectId, title, description, status, completed, createdAt and updatedAt. Dashboard metrics fields are totalProjects, activeProjects, completedTasks and pendingTasks. The dashboard loads recent project DTOs separately through `/api/projects?limit=5`, using the project list's existing sort and index.

The deadline is stored as a calendar date string so rendering does not shift across time zones. The supplied fixture uses real `YYYY-MM-DD` values; timestamps are rejected rather than silently converted.

## Status codes currently produced

- 400: malformed JSON, invalid ObjectId, query, cursor or schema values.
- 403: missing or unapproved mutation Origin.
- 404: project not found, or task not found within the requested project.
- 413: body exceeds 16 KiB.
- 415: request body is not JSON.
- 503: MongoDB selection/network failure or a database that does not support transactions.
- 500: unexpected failures.

The hosting platform may emit its own 405, 429 or upstream errors. The application does not implement a rate limiter, so configure abuse controls at the deployment edge before exposing a public demo.

## Models and indexes

| Collection | Fields | Indexes in source |
| --- | --- | --- |
| Projects | title, description, status, date-only deadline, timestamps, internal seedKey and taskWriteVersion | createdAt/ID descending; status + createdAt/ID descending; partial unique seedKey |
| Tasks | projectId, title, description, source status, completed, timestamps, internal seedKey | projectId + createdAt/ID descending; completed; partial unique seedKey |

The completed index supports dashboard task counts. The project/task cursors use compound indexes matching their sort and parent filter. Extra indexes add write cost and should be justified by measured query plans. Production deployment disables automatic index building; the operator-run seed command explicitly creates declared indexes after model initialization. Run it during setup and verify index creation.

The seed manifest is stored in seedmanifests and keyed by the fixture SHA-256 checksum. The importer is operator-run and does not overwrite records after completion. The supplied fixture uses separate top-level `projects` and `tasks` arrays; tasks are associated using `projectId`, and their descriptions/status are retained. `completed` is derived from a case-insensitive `Completed` status. See [operations](./operations.md) for strict field behavior and recovery.
