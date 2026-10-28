# Assessment requirements mapping

**Review status:** the application source covers the fixed features and technical requirements. Dependency install, line-limit, lint, TypeScript and Webpack production build are verified. The supplied fixture has been inspected and normalized locally; database import, browser/accessibility and deployment behavior are **not verified**. This page maps the locally supplied assessment brief (not included in this repository) to source and recorded checks.

## Required features

| Assessment requirement | Current source | Current evidence status |
| --- | --- | --- |
| Project list with status | Project list component and paginated projects API | Present; not run |
| Filter by status | Dynamic status query and server-side filter | Status normalization, deduplication and matching pass 4 focused tests; live API/database filtering remains unverified |
| Add project with title, description, status and deadline | Validated form and project POST route | Present; not run |
| Click project to edit | Project title and edit action open the populated form | Present; not run |
| Delete project with confirmation | Confirmation dialog and transactional cascade delete | Present; transactions not verified |
| Project detail page | Dedicated project route and view | Present; not run |
| Task add, edit, delete and completion toggle | Project-scoped task UI and nested routes | Present; not run |
| Dashboard counts | Database summary for total/active projects and completed/pending tasks | Present; counts not compared to database |
| Persist all application data through backend | Same-origin API calls and MongoDB services | Present; DB connection not established |
| Seed the supplied mock data | Strict checksum-based seed CLI and adapter | Actual fixture maps to 10 projects and 20 tasks; database import and stored counts not verified |
| Project and Task models, one-to-many relationship | Separate Mongoose models with Task.projectId | Present; schema not connected to DB |
| REST CRUD for projects and per-project tasks | Next.js Route Handlers | Present; endpoints not exercised |
| Responsive UI, loading/error states and navigation | Dashboard, project list, details, dialogs and responsive CSS | Present; visual/keyboard review not run |
| README API and setup instructions | Root README and focused API guide | Documented; static-check commands verified, database setup and seed execution unverified |

## Submission requirements

| Requirement | Status |
| --- | --- |
| Public live URL | Not deployed |
| GitHub repository | [github.com/Irshad-Ahmaed/envision_studio](https://github.com/Irshad-Ahmaed/envision_studio) |
| Local setup and stack choices in README | Documented; dependency install and static checks pass; DB setup has not been run |
| API endpoint summary | Documented; must stay synchronized with route handlers |
| Actual challenges and AI-use disclosure | README includes both; update validation after database/browser checks |
| Validation of generated code | Line-limit check, ESLint, Next route type generation, TypeScript and optimized Webpack build passed; database/browser behavior remains unverified |
| Optional walkthrough video, maximum three minutes | Not created |
| Submission form | The local assessment says a form is provided but contains no form URL |
| Deadline | Assessment states 9 July 2026, 5:00 PM IST; this date passed as of 28 October 2026 |

## Preferred and optional

- A dark theme is preferred and included in the source design.
- A walkthrough video is optional but recommended by the assessment.
- Authentication, charts, search, collaboration, uploads and time tracking are outside the fixed requirements. The unauthenticated public demo is a chosen delivery tradeoff, not a security guarantee.

## Open inputs and risks

The supplied `data/assessment-mock.json` contains a `projects` array and a separate top-level `tasks` array. It has 10 projects and 20 tasks; task `projectId` values all match a project. Project records contain id, title, description, status and date-only deadline. Tasks contain id, projectId, title, description and status (`Completed`, `In Progress` or `Pending`). The adapter preserves task descriptions/status and derives the completion boolean from the status, then attaches tasks to their parent projects. The fixture passes local normalization; run the database import and compare stored counts and relationships before claiming seed completion.

The inspected fixture uses date-only `YYYY-MM-DD` deadlines and the fields described above. Current title, status and description limits are application validation choices; the fixture passes them. The shared demo has no authentication, authorization or application-level rate limiter; anyone can change its records. Use isolated non-sensitive data and platform-level abuse controls before public deployment.

## Next validation steps

1. Import the local fixture into a transaction-capable development MongoDB; verify all 10 projects, 20 tasks, fields, statuses, parent relationships and safe reruns.
2. Exercise CRUD, pagination, validation, deletion, dashboard counts and status filtering against that database.
3. Review keyboard/screen-reader behavior, contrast, responsive layout and the description spacing fix in a browser.
4. Deploy a dedicated non-sensitive database and verify the public URL, persistence, origins, rate limits and recovery.
5. Publish the source repository and provide the optional three-minute walkthrough if desired; confirm the current deadline and submission form with the assessor.
