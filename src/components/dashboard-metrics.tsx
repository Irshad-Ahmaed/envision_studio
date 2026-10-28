"use client";

import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCheck, CircleDashed, FolderKanban, ListTodo } from "lucide-react";
import { ErrorState } from "@/components/feedback";
import { apiRequest } from "@/lib/client/api";
import type { DashboardMetricsDto } from "@/lib/shared/contracts";

const metrics = [
  { key: "totalProjects", label: "Total projects", icon: FolderKanban, tone: "purple", helper: "Across your workspace" },
  { key: "activeProjects", label: "Active projects", icon: CircleDashed, tone: "blue", helper: "Currently in motion" },
  { key: "completedTasks", label: "Tasks completed", icon: CheckCheck, tone: "green", helper: "Nice work, team" },
  { key: "pendingTasks", label: "Tasks pending", icon: ListTodo, tone: "amber", helper: "Ready for a next step" }
] as const;

const metricsKey = ["dashboard", "metrics"] as const;

export const DashboardMetrics = memo(function DashboardMetrics() {
  const query = useQuery({
    queryKey: metricsKey,
    queryFn: ({ signal }) => apiRequest<DashboardMetricsDto>("/api/dashboard", { signal })
  });

  if (!query.data && query.isPending) {
    return (
      <div className="metric-grid" role="status" aria-label="Loading dashboard metrics" aria-busy="true">
        {metrics.map((metric) => <div className="metric-card skeleton-card" key={metric.key} />)}
      </div>
    );
  }
  if (!query.data) {
    return <ErrorState message={query.error?.message ?? "The dashboard could not be loaded."} onRetry={() => void query.refetch()} />;
  }

  return (
    <>
      <div className="metric-grid">
        {metrics.map(({ key, label, icon: Icon, tone, helper }) => (
          <article className="metric-card" key={key}>
            <div className="metric-top">
              <span className={`metric-icon metric-${tone}`}><Icon size={17} /></span>
              <span className="metric-period">ALL TIME</span>
            </div>
            <div className="metric-value">{query.data[key].toLocaleString()}</div>
            <div className="metric-bottom"><span>{label}</span><small>{helper}</small></div>
          </article>
        ))}
      </div>
      {query.isError && (
        <div className="inline-error" role="status">
          Couldn’t refresh metrics. Showing the last loaded values.
          <button onClick={() => void query.refetch()}>Try again</button>
        </div>
      )}
    </>
  );
});
