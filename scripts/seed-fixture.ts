export type FixtureTask = { id: string; title: string; description: string; status: string; completed: boolean };
export type FixtureProject = {
  id: string;
  title: string;
  description: string;
  status: string;
  deadline: string;
  tasks: FixtureTask[];
};

const projectFields = new Set(["id", "_id", "title", "name", "description", "status", "deadline", "dueDate", "tasks"]);
const taskFields = new Set(["id", "_id", "projectId", "title", "name", "description", "status", "completed", "isCompleted"]);

function fail(message: string): never {
  throw new Error(message);
}

function objectRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail(label + " must be an object.");
  }
  return value as Record<string, unknown>;
}

function rejectUnknownFields(record: Record<string, unknown>, allowed: Set<string>, label: string) {
  const unknown = Object.keys(record).filter((field) => !allowed.has(field));
  if (unknown.length) {
    fail(label + " contains unsupported fields: " + unknown.join(", ") + ". Inspect the fixture and update the mapping before importing.");
  }
}

function rejectAliasConflicts(record: Record<string, unknown>, fields: string[], label: string) {
  const present = fields.filter((field) => Object.hasOwn(record, field));
  if (present.length > 1) fail(label + " contains conflicting aliases: " + present.join(", ") + ".");
}

function requiredText(value: unknown, label: string, maximum: number): string {
  if (typeof value !== "string" || !value.trim() || value.trim().length > maximum) {
    fail(label + " must be non-empty text of at most " + maximum + " characters.");
  }
  return value.trim();
}

function identity(value: unknown, fallback: string, label: string): string {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value !== "string" && typeof value !== "number") {
    fail(label + " must be a string or number.");
  }
  const result = String(value).trim();
  if (!result || result.length > 120) fail(label + " must be 1–120 characters.");
  return result;
}

function calendarDate(value: unknown, label: string): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    fail(label + " must use YYYY-MM-DD; inspect the source before mapping it.");
  }
  const [year, month, day] = value.split("-").map(Number);
  if (year < 1) fail(label + " must use a year greater than zero.");
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    fail(label + " must be a real calendar date.");
  }
  return value;
}

function normalizeTask(rawTask: unknown, label: string, fallbackId: string, projectId: string): FixtureTask {
  const source = objectRecord(rawTask, label);
  rejectUnknownFields(source, taskFields, label);
  rejectAliasConflicts(source, ["id", "_id"], label);
  rejectAliasConflicts(source, ["title", "name"], label);
  rejectAliasConflicts(source, ["completed", "isCompleted"], label);
  const linkedProjectId = source.projectId === undefined ? projectId : identity(source.projectId, "", label + " projectId");
  if (linkedProjectId !== projectId) fail(label + " must point to project " + projectId + ".");

  const title = requiredText(source.title ?? source.name, label + " title/name", 200);
  const id = identity(source.id ?? source._id, fallbackId, label + " id");
  const description = source.description === undefined ? "" : source.description;
  if (typeof description !== "string" || description.length > 5000) {
    fail(label + " description must be text of at most 5,000 characters.");
  }
  const status = source.status === undefined ? undefined : requiredText(source.status, label + " status", 40);
  let completed: boolean | undefined;
  if (Object.hasOwn(source, "completed")) completed = source.completed as boolean;
  else if (Object.hasOwn(source, "isCompleted")) completed = source.isCompleted as boolean;
  if (completed !== undefined && typeof completed !== "boolean") fail(label + " completion value must be boolean.");
  const statusCompletion = status === undefined ? undefined : status.toLowerCase() === "completed";
  if (completed !== undefined && statusCompletion !== undefined && completed !== statusCompletion) {
    fail(label + " has conflicting status and completion values.");
  }
  const isCompleted = completed ?? statusCompletion ?? false;
  return { id, title, description: description.trim(), status: status ?? (isCompleted ? "Completed" : "Pending"), completed: isCompleted };
}

export function normalizeFixture(value: unknown): FixtureProject[] {
  let root: unknown;
  let rootTasks: unknown[] | undefined;
  if (Array.isArray(value)) {
    root = value;
  } else {
    const envelope = objectRecord(value, "Fixture");
    rejectUnknownFields(envelope, new Set(["projects", "tasks"]), "Fixture");
    root = envelope.projects;
    if (Object.hasOwn(envelope, "tasks")) {
      if (!Array.isArray(envelope.tasks)) fail("Fixture tasks must be an array.");
      rootTasks = envelope.tasks;
    }
  }
  if (!Array.isArray(root)) fail("Fixture must be a JSON array or an object containing a projects array.");

  const projectIds = new Set<string>();
  const projects = root.map((entry, projectIndex) => {
    const number = projectIndex + 1;
    const source = objectRecord(entry, "Project " + number);
    rejectUnknownFields(source, projectFields, "Project " + number);
    rejectAliasConflicts(source, ["id", "_id"], "Project " + number);
    rejectAliasConflicts(source, ["title", "name"], "Project " + number);
    rejectAliasConflicts(source, ["deadline", "dueDate"], "Project " + number);

    const title = requiredText(source.title ?? source.name, "Project " + number + " title/name", 120);
    const status = requiredText(source.status, "Project " + number + " status", 40);
    const deadline = calendarDate(source.deadline ?? source.dueDate, "Project " + number + " deadline");
    const id = identity(source.id ?? source._id, String(number), "Project " + number + " id");
    if (projectIds.has(id)) fail("Project id " + id + " appears more than once.");
    projectIds.add(id);

    const descriptionValue = source.description === undefined ? "" : source.description;
    if (typeof descriptionValue !== "string" || descriptionValue.length > 5000) {
      fail("Project " + number + " description must be text of at most 5,000 characters.");
    }
    const rawTasks = source.tasks === undefined ? [] : source.tasks;
    if (!Array.isArray(rawTasks)) fail("Project " + number + " tasks must be an array.");

    const taskIds = new Set<string>();
    const tasks = rawTasks.map((rawTask, taskIndex) => {
      const taskNumber = taskIndex + 1;
      const label = "Task " + taskNumber + " in project " + number;
      const task = normalizeTask(rawTask, label, String(taskNumber), id);
      if (taskIds.has(task.id)) fail("Task id " + task.id + " appears more than once in project " + number + ".");
      taskIds.add(task.id);
      return task;
    });

    return { id, title, description: descriptionValue.trim(), status, deadline, tasks };
  });

  if (rootTasks?.length) {
    if (projects.some((project) => project.tasks.length)) fail("Use either top-level tasks or nested project tasks, not both.");
    const projectsById = new Map(projects.map((project) => [project.id, project]));
    const taskIdsByProject = new Map(projects.map((project) => [project.id, new Set<string>()]));
    rootTasks.forEach((rawTask, taskIndex) => {
      const label = "Task " + (taskIndex + 1);
      const source = objectRecord(rawTask, label);
      if (!Object.hasOwn(source, "projectId")) fail(label + " must include projectId.");
      const projectId = identity(source.projectId, "", label + " projectId");
      const project = projectsById.get(projectId);
      if (!project) fail(label + " references unknown project " + projectId + ".");
      const task = normalizeTask(source, label, String(taskIndex + 1), projectId);
      const taskIds = taskIdsByProject.get(projectId)!;
      if (taskIds.has(task.id)) fail("Task id " + task.id + " appears more than once in project " + projectId + ".");
      taskIds.add(task.id);
      project.tasks.push(task);
    });
  }

  return projects;
}
