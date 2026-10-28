# Operations and verification

**Status:** dependencies are installed. The line-limit guard, lint, TypeScript and optimized Webpack build pass. The production build completed with filesystem write access; sandboxed runs may return EPERM while creating `.next` directories. No database, fixture import, browser review or deployment has been completed. The npm registry required the approved network-access path. Turbopack could not start a PostCSS worker in this Windows sandbox, so the configured build uses Next.js's supported Webpack option.

## Required local setup

1. Install Node.js 20.19 or newer (the resolved MongoDB/Mongoose drivers require it) and run npm ci from the project directory.
2. Copy .env.example to .env.local and set MONGODB_URI to an isolated development database. Keep this value server-side and out of source control.
3. Set APP_ALLOWED_ORIGINS to exact browser origins separated by commas. For local use, include http://localhost:3000. Mutations without an Origin header or with an unlisted origin return 403.
4. The supplied `data/assessment-mock.json` has 10 projects and 20 top-level tasks. Projects use id, title, description, status and deadline; tasks use id, projectId, title, description and status. The adapter checks every parent ID, retains task descriptions/status and derives `completed` from whether status is `Completed`. It also supports nested task arrays for other valid source shapes, rejects unknown fields and validates the complete fixture before connecting. `npm run seed` performs this validation before database setup and uses an import manifest. Seed keys hash structured source IDs, preventing delimiter collisions while keeping indexed keys bounded.
5. Configure a transaction-capable MongoDB deployment: Atlas or a local replica set. A standalone local MongoDB is insufficient for project cascade deletion and task creation.
6. Run npm run check:line-limits. Then run lint, typecheck and build, and verify against a dedicated development database.
7. Run npm run seed once the mapping is confirmed. The command explicitly creates declared model indexes, then imports records by fixture checksum. Start the app with npm run dev.

## Seed safety and recovery

The importer validates the entire input before database writes, claims a checksum manifest to prevent concurrent importers, and uses a transaction per project. Seed keys are based on checksum plus supplied ID, falling back to source order when IDs are absent. A completed import is a no-op and does not overwrite user edits or restore deleted records.

A failed import retains a running manifest and refreshes its lock timestamp. Another invocation may reclaim it only after the 30-minute stale threshold. Review database state and logs before retrying. An incomplete import can resume through set-on-insert writes, but a changed fixture has a different checksum and is a different import. Do not combine revisions or run recovery against the shared demo without an explicit backup and operator review. The app does not lock out writes during seed, so complete and verify the initial import before publishing the URL.

## Current implementation security

- Database credentials are never part of the client contract.
- Writes require exact Origin allowlisting, strict Zod schemas, JSON content type and a streaming 16 KiB body limit. Query keys, repeated parameters, IDs, task ownership and page sizes are validated.
- API errors avoid returning stack traces and connection details. The UI uses no-store API requests.
- Next config sets nosniff, Referrer-Policy, frame denial, DNS prefetch off and a Permissions-Policy; production adds HSTS.
- **Not provided:** sign-in, authorization, tenant isolation or application-level rate limiting. An Origin header can be forged by non-browser callers. Public deployment must use only non-sensitive data and platform-level abuse controls.

## Verification record

The line-limit guard, status-filter tests, lint and TypeScript check were run after the filter changes. No live database or browser checks were performed. Record exact commands and outcomes below.

| Check | Status |
| --- | --- |
| Line-limit guard | Passed via npm run check:line-limits; every authored source/config file is at or below 250 lines |
| Status option deduplication and matching | Passed via npm run test:filters (4 cases); live API/database filtering remains unverified |
| Lint | Passed via npm run lint |
| TypeScript | Passed via npm run typecheck |
| Optimized production build | Passed via `npm run build` using Webpack with filesystem write access; the restricted sandbox may return EPERM creating `.next` output directories |
| Production dependency audit | Not refreshed: npm registry DNS failed in this environment; rerun in connected CI. Install previously reported zero advisories |
| Default Turbopack production build | Fails in this sandbox because the PostCSS worker exits before connection; not the configured build command |
| Mongo connection and index creation | Not run; no development URI is configured |
| Project and task CRUD / persistence | Not run |
| Count accuracy and pagination | Not run against stored records |
| Transaction race behavior | Not run on a replica set |
| Fixture normalization | Passed locally for 10 projects and 20 tasks; all task parent IDs match, descriptions/status are preserved |
| Database fixture import, stored counts and safe retry | Not run; verify against the configured transaction-capable database |
| Keyboard, screen-reader, contrast and responsive browser review | Not run |
| Public URL, repository and deployment smoke | Not completed |

## Release checklist

- [ ] Import the supplied fixture, compare all 10 projects, 20 tasks and parent relationships, then verify completed and interrupted rerun behavior.
- [ ] Install packages and pass line-limit, status-filter, lint, type check and production build checks.
- [ ] Create an isolated transaction-capable database and verify all CRUD, scope checks, counts, filters and cursors.
- [ ] Review keyboard/focus behavior, contrast, reduced motion and responsive layouts in a browser.
- [ ] Configure exact production origin, hosting-level rate limits, HTTPS, database least privilege and backups.
- [ ] Deploy, seed before sharing, and verify public URL and persistence without using sensitive records.
- [ ] Update README with verified setup, actual challenges, AI use and validation; provide repository, live URL, and optional walkthrough.
- [ ] Confirm current deadline and submission form with the assessor.
