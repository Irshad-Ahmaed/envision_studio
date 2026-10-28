import { api, assertOnlyQueryKeys } from "@/lib/server/http";
import { getDashboardMetrics } from "@/lib/server/services/projects";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return api(request, async () => {
    assertOnlyQueryKeys(new URL(request.url), []);
    return getDashboardMetrics();
  });
}
