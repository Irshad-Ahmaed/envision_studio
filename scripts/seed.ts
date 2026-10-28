import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { loadEnvConfig } from "@next/env";
import mongoose from "mongoose";
import { MongoServerError, type Document as MongoDocument } from "mongodb";
import { connectToDatabase } from "../src/lib/db/connection";
import { Project, Task } from "../src/lib/db/models";
import { normalizeFixture } from "./seed-fixture";

type SeedManifest = MongoDocument & {
  _id: string;
  status: "running" | "complete";
  lockToken?: string;
  lockedAt?: Date;
  sourceFile?: string;
  completedAt?: Date;
  processedProjects?: number;
  processedTasks?: number;
  lastErrorType?: string;
};

function fail(message: string): never {
  throw new Error(message);
}

function seedKey(checksum: string, kind: "project" | "task", ...sourceIds: string[]) {
  const identity = createHash("sha256").update(JSON.stringify(sourceIds)).digest("hex");
  return checksum + ":" + kind + ":" + identity;
}

async function main() {
  loadEnvConfig(process.cwd());
  const file = path.resolve(process.env.SEED_FILE ?? "./data/assessment-mock.json");
  const source = await readFile(file);
  const checksum = createHash("sha256").update(source).digest("hex");
  const projects = normalizeFixture(JSON.parse(source.toString("utf8")) as unknown);
  if (!projects.length) fail("The fixture contains no projects; refusing an empty import.");

  await connectToDatabase();
  await Promise.all([Project.init(), Task.init()]);
  // Production disables autoIndex; the operator-run seed is the explicit index setup step.
  await Promise.all([Project.createIndexes(), Task.createIndexes()]);
  const database = mongoose.connection.db;
  if (!database) fail("The MongoDB connection is not ready.");
  const manifest = database.collection<SeedManifest>("seedmanifests");
  const existing = await manifest.findOne({ _id: checksum });
  if (existing?.status === "complete") {
    process.stdout.write("Fixture " + checksum.slice(0, 12) + " is already imported. No changes made.\n");
    return;
  }

  const token = randomUUID();
  const staleBefore = new Date(Date.now() - 30 * 60 * 1000);
  let claimed = false;
  try {
    await manifest.insertOne({
      _id: checksum,
      status: "running",
      lockToken: token,
      lockedAt: new Date(),
      sourceFile: path.basename(file)
    });
    claimed = true;
  } catch (error) {
    if (!(error instanceof MongoServerError) || error.code !== 11000) throw error;
    const resumed = await manifest.updateOne(
      { _id: checksum, status: "running", lockedAt: { $lt: staleBefore } },
      { $set: { lockToken: token, lockedAt: new Date() } }
    );
    claimed = resumed.modifiedCount === 1;
  }
  if (!claimed) fail("Another seed operation is active, or this fixture needs operator review.");

  let processedProjects = 0;
  let processedTasks = 0;
  try {
    for (const [index, project] of projects.entries()) {
      const lock = await manifest.updateOne(
        { _id: checksum, lockToken: token },
        { $set: { lockedAt: new Date() } }
      );
      if (lock.matchedCount !== 1) fail("The seed lock was lost; stop and inspect the manifest.");
      const projectKey = seedKey(checksum, "project", project.id);
      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          await Project.updateOne(
            { seedKey: projectKey },
            { $setOnInsert: {
              seedKey: projectKey,
              taskWriteVersion: 0,
              title: project.title,
              description: project.description,
              status: project.status,
              deadline: project.deadline
            } },
            { upsert: true, session, setDefaultsOnInsert: true }
          );
          const storedProject = await Project.findOne({ seedKey: projectKey }).session(session);
          if (!storedProject) fail("Could not resolve imported project " + (index + 1) + ".");
          await Project.updateOne(
            { _id: storedProject._id },
            { $inc: { taskWriteVersion: 1 } },
            { session, timestamps: false }
          );
          for (const task of project.tasks) {
            const taskKey = seedKey(checksum, "task", project.id, task.id);
            await Task.updateOne(
              { seedKey: taskKey },
              { $setOnInsert: {
                seedKey: taskKey,
                projectId: storedProject._id,
                title: task.title,
                description: task.description,
                status: task.status,
                completed: task.completed
              } },
              { upsert: true, session, setDefaultsOnInsert: true }
            );
          }
        });
      } finally {
        await session.endSession();
      }
      processedProjects += 1;
      processedTasks += project.tasks.length;
    }

    const completed = await manifest.updateOne(
      { _id: checksum, lockToken: token },
      {
        $set: { status: "complete", completedAt: new Date(), processedProjects, processedTasks },
        $unset: { lockToken: "", lockedAt: "" }
      }
    );
    if (completed.modifiedCount !== 1) fail("The seed lock was lost before completion; inspect the manifest.");
    process.stdout.write("Processed " + processedProjects + " projects and " + processedTasks + " tasks from " + path.basename(file) + ".\n");
  } catch (error) {
    await manifest.updateOne(
      { _id: checksum, lockToken: token },
      { $set: { status: "running", lastErrorType: error instanceof Error ? error.name : "UnknownError", lockedAt: new Date() } }
    );
    throw error;
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Seed import failed.");
  process.exitCode = 1;
}).finally(async () => {
  await mongoose.disconnect();
});
