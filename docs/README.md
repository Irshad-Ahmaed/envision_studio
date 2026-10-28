# Project documentation

**Current state:** the Next.js application, MongoDB/Mongoose models, REST routes, seed CLI, responsive screens and implementation documentation are present. Dependencies are installed, and line-limit, lint, TypeScript and Webpack production-build checks pass. The supplied 10-project, 20-task fixture is mapped and locally normalized; database import, browser review and deployment have not been verified.

## Start here

| Reader | Read | You will learn |
| --- | --- | --- |
| Everyone | [Implementation plan](../IMPLEMENTATION_PLAN.md) | Assessment scope, design, architecture, security and delivery decisions |
| Assessor | [Assessment mapping](./assessment-mapping.md) | Requirement-to-source coverage and what remains unverified |
| Developer or reviewer | [Architecture and decisions](./architecture.md) | Module boundaries, request flow, database consistency and tradeoffs |
| API developer | [API and data](./api-and-data.md) | Implemented routes, request/response shapes, indexes and errors |
| Designer or product reviewer | [UX and handoff](./ux-and-handoff.md) | Implemented screens, interactions, accessibility and reference inspiration |
| Operator or tester | [Operations and verification](./operations.md) | Environment setup, strict seed behavior, known limits and release checks |

The assessment brief was supplied locally and is not reproduced in this source repository. See [assessment mapping](./assessment-mapping.md) for the feature and submission requirement cross-reference. The app is an assessment demo, not a production-ready multi-user service.

## What is implemented in source

- Dashboard with four database-backed summary metrics and recent projects.
- Responsive project list, status filter, cursor pagination, project create/edit/delete, and dedicated project details.
- Project-scoped task list, create/edit/delete and completion toggle.
- Next.js Route Handlers, strict Zod request validation, Mongoose Project and Task models, indexes, safe DTOs, size and query guards, and transaction-backed relationship changes.
- An operator-run seed importer that validates known fixture fields, rejects unknown fields, and uses a checksum manifest for safe retries.
- Original dark-theme CSS and local architecture/workflow diagrams.

Source presence does not confirm that the application works against a database. Verify imported record counts, parent/child relationships and safe reruns before claiming seeded-data compliance.

## Key constraints

- Selected stack: Next.js App Router, TypeScript, Tailwind CSS, MongoDB Atlas and Mongoose.
- Code/config files have a hard limit of 250 physical lines. Run the line-limit check after edits.
- The demo has no authentication or authorization. A public instance is writable and must contain only non-sensitive data. Put it behind platform-level abuse controls before sharing.
- Transaction-backed operations require a transaction-capable MongoDB deployment, such as Atlas or a replica set.
- The assessment deadline (9 July 2026, 5:00 PM IST) has passed; its local copy does not include the submission-form URL.

## Documentation maintenance

- Keep source coverage distinct from runtime or deployment verification.
- Update this index and the focused pages when routes, schemas, security behavior or decisions change.
- Record exact commands and outcomes only after running them.
- Do not claim the fixture was imported until every source record and relationship is checked against MongoDB.
- Diagrams are local PNG images; the illustrative system and data model are conceptual images, while workflow diagrams are generated from PowerShell source. Keep images and descriptions aligned with code.
