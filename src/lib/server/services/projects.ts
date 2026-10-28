import "server-only";
import mongoose from "mongoose";
import { Project, Task } from "@/lib/db/models";
import { connectToDatabase } from "@/lib/db/connection";
import { projectDto, taskDto } from "@/lib/server/dto";
import { HttpError } from "@/lib/server/http";
import { decodeCursor, encodeCursor } from "@/lib/server/cursor";
import { projectStatuses, type ProjectInput, type TaskValues } from "@/lib/shared/contracts";
import { normalizeStatus, statusMatchPattern, uniqueStatuses } from "@/lib/shared/statuses";

function statusFilter(status: string | null) {
  if (status === null || status.trim() === "") return {};
  const normalized = status.trim();
  if (normalized.length > 40) throw new HttpError(400, "INVALID_STATUS", "The status filter is invalid.");
  return { status: statusMatchPattern(normalized) };
}

async function assertProjectStatusAllowed(status: string) {
  if (projectStatuses.includes(status as (typeof projectStatuses)[number])) return;
  if (await Project.exists({ status })) return;
  throw new HttpError(400, "INVALID_STATUS", "Choose a built-in or existing project status.");
}

export async function listProjects(status: string | null, limit: number, cursorValue: string | null) {
  await connectToDatabase();
  const filter = statusFilter(status);
  const normalizedStatus = status ? normalizeStatus(status) : "";
  const scope = normalizedStatus ? `projects:status:${normalizedStatus}` : "projects:all";
  const cursor = decodeCursor(cursorValue, scope);
  const query = cursor ? {
    ...filter,
    $or: [
      { createdAt: { $lt: new Date(cursor.createdAt) } },
      { createdAt: new Date(cursor.createdAt), _id: { $lt: cursor.id } }
    ]
  } : filter;
  const results = await Project.find(query)
    .select("title description status deadline createdAt updatedAt")
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit + 1)
    .lean();
  const hasMore = results.length > limit;
  const items = hasMore ? results.slice(0, limit) : results;
  const last = items.at(-1);
  return {
    data: items.map((item) => projectDto(item)),
    page: { nextCursor: hasMore && last ? encodeCursor({ createdAt: last.createdAt.toISOString(), id: last._id.toString(), scope }) : null }
  };
}

export async function listProjectStatuses() {
  await connectToDatabase();
  const existing = await Project.distinct("status");
  const stored = existing.filter((value): value is string => typeof value === "string" && Boolean(value.trim()));
  return uniqueStatuses([...projectStatuses, ...stored]);
}

export async function getProject(projectId: string) {
  await connectToDatabase();
  const project = await Project.findById(projectId).lean();
  if (!project) throw new HttpError(404, "PROJECT_NOT_FOUND", "This project could not be found.");
  return projectDto(project);
}

export async function createProject(input: ProjectInput) {
  await connectToDatabase();
  await assertProjectStatusAllowed(input.status);
  const project = await Project.create({ ...input, taskWriteVersion: 0 });
  return projectDto(project);
}

export async function updateProject(projectId: string, input: Partial<ProjectInput>) {
  await connectToDatabase();
  if (input.status !== undefined) await assertProjectStatusAllowed(input.status);
  const project = await Project.findByIdAndUpdate(projectId, { $set: input }, { new: true, runValidators: true });
  if (!project) throw new HttpError(404, "PROJECT_NOT_FOUND", "This project could not be found.");
  return projectDto(project);
}

export async function deleteProject(projectId: string) {
  await connectToDatabase();
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const deleted = await Project.findByIdAndDelete(projectId, { session });
      if (!deleted) throw new HttpError(404, "PROJECT_NOT_FOUND", "This project could not be found.");
      await Task.deleteMany({ projectId: deleted._id }).session(session);
    });
  } finally { await session.endSession(); }
}

export async function listTasks(projectId: string, limit: number, cursorValue: string | null) {
  await connectToDatabase();
  const project = await Project.exists({ _id: projectId });
  if (!project) throw new HttpError(404, "PROJECT_NOT_FOUND", "This project could not be found.");
  const scope = `tasks:${projectId}`;
  const cursor = decodeCursor(cursorValue, scope);
  const filter = cursor ? {
    projectId,
    $or: [
      { createdAt: { $lt: new Date(cursor.createdAt) } },
      { createdAt: new Date(cursor.createdAt), _id: { $lt: cursor.id } }
    ]
  } : { projectId };
  const results = await Task.find(filter).sort({ createdAt: -1, _id: -1 }).limit(limit + 1).lean();
  const hasMore = results.length > limit;
  const items = hasMore ? results.slice(0, limit) : results;
  const last = items.at(-1);
  return {
    data: items.map((item) => taskDto(item)),
    page: { nextCursor: hasMore && last ? encodeCursor({ createdAt: last.createdAt.toISOString(), id: last._id.toString(), scope }) : null }
  };
}

export async function createTask(projectId: string, input: TaskValues) {
  await connectToDatabase();
  const session = await mongoose.startSession();
  let created: InstanceType<typeof Task> | undefined;
  try {
    await session.withTransaction(async () => {
      const project = await Project.findOneAndUpdate(
        { _id: projectId }, { $inc: { taskWriteVersion: 1 } },
        { session, new: false, timestamps: false }
      );
      if (!project) throw new HttpError(404, "PROJECT_NOT_FOUND", "This project could not be found.");
      const [task] = await Task.create([{ projectId: project._id, ...input, status: input.completed ? "Completed" : "Pending" }], { session });
      created = task;
    });
  } finally { await session.endSession(); }
  if (!created) throw new Error("Task creation did not complete.");
  return taskDto(created);
}

export async function updateTask(projectId: string, taskId: string, input: Partial<TaskValues>) {
  await connectToDatabase();
  const update = { ...input, ...(input.completed === undefined ? {} : { status: input.completed ? "Completed" : "Pending" }) };
  const task = await Task.findOneAndUpdate({ _id: taskId, projectId }, { $set: update }, { new: true, runValidators: true });
  if (!task) throw new HttpError(404, "TASK_NOT_FOUND", "This task could not be found in this project.");
  return taskDto(task);
}

export async function getTask(projectId: string, taskId: string) {
  await connectToDatabase();
  const task = await Task.findOne({ _id: taskId, projectId }).lean();
  if (!task) throw new HttpError(404, "TASK_NOT_FOUND", "This task could not be found in this project.");
  return taskDto(task);
}

export async function deleteTask(projectId: string, taskId: string) {
  await connectToDatabase();
  const result = await Task.deleteOne({ _id: taskId, projectId });
  if (!result.deletedCount) throw new HttpError(404, "TASK_NOT_FOUND", "This task could not be found in this project.");
}

export async function getDashboardMetrics() {
  await connectToDatabase();
  const [totalProjects, activeProjects, completedTasks, pendingTasks] = await Promise.all([
    Project.countDocuments(),
    Project.countDocuments({ status: /^active$/i }),
    Task.countDocuments({ completed: true }),
    Task.countDocuments({ completed: false })
  ]);
  return { totalProjects, activeProjects, completedTasks, pendingTasks };
}
