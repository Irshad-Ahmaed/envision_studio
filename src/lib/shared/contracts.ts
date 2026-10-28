import { z } from "zod";

export const projectStatuses = ["active", "completed", "on_hold"] as const;
export type ProjectStatus = (typeof projectStatuses)[number];

const titleSchema = z.string().trim().min(1, "Enter a title.").max(120, "Use 120 characters or fewer.");
const descriptionSchema = z.string().trim().max(5000, "Use 5,000 characters or fewer.");
const statusSchema = z.string().trim().min(1, "Choose a status.").max(40);
const deadlineSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid deadline.").refine((value) => {
  const [year, month, day] = value.split("-").map(Number);
  if (year < 1) return false;
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}, "Choose a valid calendar date.");

export const createProjectSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  status: statusSchema,
  deadline: deadlineSchema
}).strict();

export const updateProjectSchema = createProjectSchema.partial().strict().refine((value) => Object.keys(value).length > 0, "Provide at least one field to update.");

const taskDescriptionSchema = z.string().trim().max(5000, "Use 5,000 characters or fewer.");
export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Enter a task name.").max(200, "Use 200 characters or fewer."),
  description: taskDescriptionSchema.optional().default(""),
  completed: z.boolean().optional().default(false)
}).strict();

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: taskDescriptionSchema.optional(),
  completed: z.boolean().optional()
}).strict().refine((value) => Object.keys(value).length > 0, "Provide at least one field to update.");

export type ProjectInput = z.infer<typeof createProjectSchema>;
export type TaskInput = z.input<typeof createTaskSchema>;
export type TaskValues = z.output<typeof createTaskSchema>;
export type ProjectDto = ProjectInput & { id: string; createdAt: string; updatedAt: string };
export type TaskDto = TaskValues & { id: string; projectId: string; status: string; createdAt: string; updatedAt: string };
export type PageDto<T> = { data: T[]; page: { nextCursor: string | null } };
export type DashboardMetricsDto = {
  totalProjects: number;
  activeProjects: number;
  completedTasks: number;
  pendingTasks: number;
};

export function statusLabel(status: string): string {
  const labels: Record<string, string> = { active: "Active", completed: "Completed", on_hold: "On hold" };
  return labels[status.toLowerCase()] ?? status.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
