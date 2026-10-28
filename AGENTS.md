# Repository instructions

## Project goal

Build the EnvisionStudio project-management assessment using Next.js App Router, TypeScript, Tailwind CSS, MongoDB Atlas and Mongoose. The local assessment Markdown is authoritative for required behavior. The implementation plan and `docs/` explain decisions; update them when the implementation changes.

## Skills and engineering practices

- Apply senior full-stack engineering skills: Next.js App Router and React server/client boundaries, TypeScript contracts, MongoDB/Mongoose schema/query/index design, REST API security, accessible responsive UI, and maintainable technical documentation.
- Keep Route Handlers thin: parse HTTP input, validate it, call a domain service and return a safe response. Keep persistence and relationship rules in server-only services; keep database access out of browser components.
- Use React Query as the browser source of API data. After a successful mutation, invalidate the affected project/task pages and dashboard; preserve form values and show a useful error if a write fails.
- Use strict shared Zod schemas for input and UI feedback. Allowlist fields and query keys, reject repeated parameters, cap JSON bodies and page sizes, validate ObjectIds, and scope every task operation to both project and task IDs.
- Design MongoDB queries with their sort/filter indexes in mind. Use projections or lean reads where appropriate, avoid unbounded reads, keep transactions sequential, and protect task/project integrity during create/delete races.
- Treat import data as authoritative. Validate the entire fixture before writes, preserve every meaningful field through an explicit adapter, and fail on unknown fields instead of silently dropping them. Never fabricate fixture records.
- Build keyboard-usable forms and dialogs with labels, visible focus, loading/error/empty states, useful announcements, reduced-motion support and status labels that do not rely on color alone.
- Keep visual decisions on shared CSS tokens and consistent 4px corners; prefer readable text sizes and adequate contrast over decorative density.
- Do not add dependencies without a concrete need. Do not expose MongoDB credentials to client bundles or NEXT_PUBLIC_* variables.
- Treat the supplied mock fixture as the source of truth. Inspect its fields and relationships before finalizing schema constraints or seed mappings. Do not invent records and label them as assessment data.
- Keep every source-code file at or below **250 physical lines**. Count lines after edits. Split modules by responsibility before a file reaches the limit. This limit applies to TypeScript/TSX, JavaScript, CSS, PowerShell, configuration and scripts. Markdown documentation is exempt.
- Keep the assessment scope focused: project CRUD and status filter; project detail; per-project task CRUD/completion; four dashboard metrics; persisted database data; responsive UI; loading/error states; seed import; README and deployment preparation.
- Use same-origin REST Route Handlers for frontend data operations. Never expose MongoDB credentials to client code or `NEXT_PUBLIC_*` variables.
- Validate every HTTP input using strict schemas, allowlist fields and query parameters, bound request bodies and list page sizes, scope task operations to both project and task IDs, and return safe error messages.
- Keep database/service code on the Node.js server. Keep browser-shared contracts free of database, secret or privileged imports. Maintain and verify the import boundary for both Next.js and the seed CLI.
- Protect project/task relationships during concurrent creation and deletion. Keep transaction callbacks sequential and free of side effects; validate transaction support in the target MongoDB environment.
- Use actual database-backed data for UI and summaries. Keep pagination state, loading, empty, error, retry and form validation states visible and accessible.
- Follow the agreed visual system: charcoal background, violet accent, small 4px corners, restrained borders, clear text contrast and status labels that do not depend on color alone.
- Document decisions, actual commands and verified results honestly. Keep diagrams and API documentation synchronized with code. Mark unimplemented behavior as planned.

## Workflow

1. Read the assessment and relevant docs before changing behavior.
2. Make the smallest coherent change; preserve existing user data and files.
3. Check every edited source file is at most 250 lines and keep imports organized.
   Run `npm run check:line-limits` after code/config edits. The limit applies to physical source/config lines, not Markdown or supplied fixture data.
4. When explicitly asked to verify, run the narrowest relevant checks and report exact outcomes. Do not claim a database, fixture, test or deployment was verified unless it was.
5. Do not deploy, submit externally or publish secrets as part of local implementation.

## Current known constraints

- The linked mock-data document was not accessible, but the supplied fixture is now present at `data/assessment-mock.json`. Its 10 projects and 20 tasks pass local normalization; database import, stored counts and relationships remain unverified.
- The assessment's written deadline has passed, and its stated submission-form URL is missing. Do not invent replacements.
- The selected public demo has no authentication. It must contain non-sensitive data and must be documented as publicly writable.
