import { api, assertObjectId, assertOnlyQueryKeys, readJson } from "@/lib/server/http";
import { deleteProject, getProject, updateProject } from "@/lib/server/services/projects";
import { updateProjectSchema } from "@/lib/shared/contracts";

export const runtime = "nodejs";
type Context = { params: Promise<{ projectId: string }> };

export async function GET(request: Request, { params }: Context) {
  return api(request, async () => {
    const { projectId } = await params;
    assertObjectId(projectId);
    assertOnlyQueryKeys(new URL(request.url), []);
    return getProject(projectId);
  });
}

export async function PATCH(request: Request, { params }: Context) {
  return api(request, async () => {
    const { projectId } = await params;
    assertObjectId(projectId);
    assertOnlyQueryKeys(new URL(request.url), []);
    return updateProject(projectId, updateProjectSchema.parse(await readJson(request)));
  }, 200, true);
}

export async function DELETE(request: Request, { params }: Context) {
  return api(request, async () => {
    const { projectId } = await params;
    assertObjectId(projectId);
    assertOnlyQueryKeys(new URL(request.url), []);
    await deleteProject(projectId);
  }, 204, true);
}
