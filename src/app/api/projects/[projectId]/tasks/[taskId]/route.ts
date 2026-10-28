import { api, assertObjectId, assertOnlyQueryKeys, readJson } from "@/lib/server/http";
import { deleteTask, getTask, updateTask } from "@/lib/server/services/projects";
import { updateTaskSchema } from "@/lib/shared/contracts";

export const runtime = "nodejs";
type Context = { params: Promise<{ projectId: string; taskId: string }> };

export async function GET(request: Request, { params }: Context) {
  return api(request, async () => {
    const { projectId, taskId } = await params;
    assertObjectId(projectId); assertObjectId(taskId);
    assertOnlyQueryKeys(new URL(request.url), []);
    return getTask(projectId, taskId);
  });
}

export async function PATCH(request: Request, { params }: Context) {
  return api(request, async () => {
    const { projectId, taskId } = await params;
    assertObjectId(projectId); assertObjectId(taskId);
    assertOnlyQueryKeys(new URL(request.url), []);
    return updateTask(projectId, taskId, updateTaskSchema.parse(await readJson(request)));
  }, 200, true);
}

export async function DELETE(request: Request, { params }: Context) {
  return api(request, async () => {
    const { projectId, taskId } = await params;
    assertObjectId(projectId); assertObjectId(taskId);
    assertOnlyQueryKeys(new URL(request.url), []);
    await deleteTask(projectId, taskId);
  }, 204, true);
}
