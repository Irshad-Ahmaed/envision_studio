import { api, assertObjectId, assertOnlyQueryKeys, readJson } from "@/lib/server/http";
import { parseLimit } from "@/lib/server/cursor";
import { createTaskSchema } from "@/lib/shared/contracts";
import { createTask, listTasks } from "@/lib/server/services/projects";

export const runtime = "nodejs";
type Context = { params: Promise<{ projectId: string }> };

export async function GET(request: Request, { params }: Context) {
  return api(request, async () => {
    const { projectId } = await params;
    assertObjectId(projectId);
    const url = new URL(request.url);
    assertOnlyQueryKeys(url, ["limit", "cursor"]);
    return listTasks(projectId, parseLimit(url.searchParams.get("limit")), url.searchParams.get("cursor"));
  });
}

export async function POST(request: Request, { params }: Context) {
  return api(request, async () => {
    const { projectId } = await params;
    assertObjectId(projectId);
    assertOnlyQueryKeys(new URL(request.url), []);
    return createTask(projectId, createTaskSchema.parse(await readJson(request)));
  }, 201, true);
}
