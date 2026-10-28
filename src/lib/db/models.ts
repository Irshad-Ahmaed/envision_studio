import mongoose, { Schema, type Model } from "mongoose";

function isDateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  if (year < 1) return false;
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export type ProjectRecord = {
  title: string;
  description: string;
  status: string;
  deadline: string;
  seedKey?: string;
  taskWriteVersion: number;
  createdAt: Date;
  updatedAt: Date;
};

export type TaskRecord = {
  projectId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  status: string;
  completed: boolean;
  seedKey?: string;
  createdAt: Date;
  updatedAt: Date;
};

const projectSchema = new Schema<ProjectRecord>({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, trim: true, maxlength: 5000, default: "" },
  status: { type: String, required: true, trim: true, maxlength: 40 },
  deadline: { type: String, required: true, validate: { validator: isDateOnly, message: "Deadline must be a valid YYYY-MM-DD date." } },
  seedKey: { type: String, select: false },
  taskWriteVersion: { type: Number, default: 0, select: false }
}, { timestamps: true, versionKey: false });

const taskSchema = new Schema<TaskRecord>({
  projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, immutable: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, trim: true, maxlength: 5000, default: "" },
  status: { type: String, trim: true, maxlength: 40, default: "Pending" },
  completed: { type: Boolean, default: false },
  seedKey: { type: String, select: false }
}, { timestamps: true, versionKey: false });

projectSchema.index({ createdAt: -1, _id: -1 });
projectSchema.index({ status: 1, createdAt: -1, _id: -1 });
projectSchema.index({ seedKey: 1 }, { unique: true, partialFilterExpression: { seedKey: { $type: "string" } } });
taskSchema.index({ projectId: 1, createdAt: -1, _id: -1 });
taskSchema.index({ completed: 1 });
taskSchema.index({ seedKey: 1 }, { unique: true, partialFilterExpression: { seedKey: { $type: "string" } } });

export const Project: Model<ProjectRecord> = mongoose.models.Project ?? mongoose.model<ProjectRecord>("Project", projectSchema);
export const Task: Model<TaskRecord> = mongoose.models.Task ?? mongoose.model<TaskRecord>("Task", taskSchema);
