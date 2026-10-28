"use client";

import { memo, type ReactNode } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Plus } from "lucide-react";
import { EmptyState, ErrorState, LoadingRows } from "@/components/feedback";
import { apiRequest } from "@/lib/client/api";
import type { PageDto, ProjectDto } from "@/lib/shared/contracts";
import { statusLabel } from "@/lib/shared/contracts";
import { formatDeadline } from "@/lib/shared/format";

const recentProjectsKey = ["projects", "", null, 5] as const;

function RecentProjectTable({ projects }: { projects: ProjectDto[] }) {
  return (
    <div className="table-scroll">
      <table className="data-table recent-table">
        <thead><tr><th>Project</th><th>Status</th><th>Deadline</th><th /></tr></thead>
        <tbody>{projects.map((project) => (
          <tr key={project.id}>
            <td>
              <Link className="project-name-button" href={`/projects/${project.id}`}>{project.title}</Link>{" "}
              <span className="recent-description">{project.description || "No description"}</span>
            </td>
            <td>
              <span className={`status-badge status-${project.status.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
                <i />{statusLabel(project.status)}
              </span>
            </td>
            <td><span className="date-cell">{formatDeadline(project.deadline)}</span></td>
            <td>
              <Link className="table-action" href={`/projects/${project.id}`} aria-label={`View ${project.title}`}>
                <ArrowRight size={15} />
              </Link>
            </td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

export const DashboardRecentProjects = memo(function DashboardRecentProjects({ onCreate }: { onCreate: () => void }) {
  const query = useQuery({
    queryKey: recentProjectsKey,
    queryFn: ({ signal }) => apiRequest<PageDto<ProjectDto>>("/api/projects?limit=5", { signal })
  });
  let content: ReactNode;

  if (query.isPending && !query.data) {
    content = <LoadingRows rows={3} />;
  } else if (!query.data) {
    content = <ErrorState message={query.error?.message ?? "Recent projects could not be loaded."} onRetry={() => void query.refetch()} />;
  } else if (query.data.data.length === 0) {
    content = (
      <EmptyState
        title="Your workspace is ready"
        description="Create your first project and watch your dashboard come to life."
        action={<button className="button button-primary button-small" onClick={onCreate}><Plus size={14} /> Create a project</button>}
      />
    );
  } else {
    content = <RecentProjectTable projects={query.data.data} />;
  }

  return (
    <section className="panel recent-panel">
      <div className="panel-toolbar">
        <div>
          <div className="eyebrow section-eyebrow">IN MOTION</div>
          <h2>Recent projects</h2>
          <p>A quick look at what’s on the board.</p>
        </div>
        <Link className="text-link" href="/projects">All projects <ArrowRight size={15} /></Link>
      </div>
      {content}
      {query.isError && query.data && (
        <div className="inline-error" role="status">
          Couldn’t refresh recent projects. Showing the last loaded results.
          <button onClick={() => void query.refetch()}>Try again</button>
        </div>
      )}
    </section>
  );
});
