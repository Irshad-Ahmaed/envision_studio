import "server-only";
import type { ProjectDto, TaskDto } from "@/lib/shared/contracts";
import type { Types } from "mongoose";

type ProjectSource = {
  _id: Types.ObjectId;
  title: string;
  description: string;
  status: string;
  deadline: string;
  createdAt: Date;
  updatedAt: Date;
};
type TaskSource = {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  title: string;
  description?: string;
  status?: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export function projectDto(document: ProjectSource): ProjectDto {
  return {
    id: document._id.toString(),
    title: document.title,
    description: document.description,
    status: document.status,
    deadline: document.deadline,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString()
  };
}

export function taskDto(document: TaskSource): TaskDto {
  return {
    id: document._id.toString(),
    projectId: document.projectId.toString(),
    title: document.title,
    description: document.description ?? "",
    status: document.status ?? (document.completed ? "Completed" : "Pending"),
    completed: document.completed,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString()
  };
}
