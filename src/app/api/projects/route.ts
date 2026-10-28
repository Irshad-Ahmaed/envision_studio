import { api, assertOnlyQueryKeys, readJson } from "@/lib/server/http";
import { parseLimit } from "@/lib/server/cursor";
import { createProjectSchema } from "@/lib/shared/contracts";
import { createProject, listProjects } from "@/lib/server/services/projects";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return api(request, async () => {
    const url = new URL(request.url);
    assertOnlyQueryKeys(url, ["status", "limit", "cursor"]);
    return listProjects(url.searchParams.get("status"), parseLimit(url.searchParams.get("limit")), url.searchParams.get("cursor"));
  });
}

export async function POST(request: Request) {
  return api(request, async () => {
    assertOnlyQueryKeys(new URL(request.url), []);
    return createProject(createProjectSchema.parse(await readJson(request)));
  }, 201, true);
}
