"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, ChevronDown, Eye, Pencil, Plus, SlidersHorizontal, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/client/api";
import type { PageDto, ProjectDto } from "@/lib/shared/contracts";
import { projectStatuses, statusLabel } from "@/lib/shared/contracts";
import { uniqueStatuses } from "@/lib/shared/statuses";
import { formatDeadline } from "@/lib/shared/format";
import { LoadingRows, ErrorState, EmptyState, Pagination } from "@/components/feedback";
import { ProjectFormDialog } from "@/components/project-form-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useToast } from "@/components/toast";

export function ProjectList() {
  const client = useQueryClient();
  const toast = useToast();
  const [status, setStatus] = useState(""); const [cursor, setCursor] = useState<string | null>(null); const [history, setHistory] = useState<string[]>([]);
  const [formOpen, setFormOpen] = useState(false); const [editing, setEditing] = useState<ProjectDto | null>(null); const [deleting, setDeleting] = useState<ProjectDto | null>(null);
  useEffect(() => { const open = () => { setEditing(null); setFormOpen(true); }; window.addEventListener("open-new-project", open); return () => window.removeEventListener("open-new-project", open); }, []);
  const queryKey = ["projects", status, cursor, 25];
  const query = useQuery({ queryKey, queryFn: () => apiRequest<PageDto<ProjectDto>>(`/api/projects?limit=25${status ? `&status=${encodeURIComponent(status)}` : ""}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`) });
  const statusesQuery = useQuery({ queryKey: ["project-statuses"], queryFn: () => apiRequest<string[]>("/api/projects/statuses") });
  async function refresh() { await client.invalidateQueries({ queryKey: ["projects"] }); await client.invalidateQueries({ queryKey: ["dashboard"] }); await client.invalidateQueries({ queryKey: ["project-statuses"] }); }
  function openEdit(project: ProjectDto | null = null) { setEditing(project); setFormOpen(true); }
  const projects = query.data?.data ?? [];
  const filterStatuses = uniqueStatuses([...(status ? [status] : []), ...(statusesQuery.data ?? projectStatuses), ...projects.map((project) => project.status)]);
  return <>
    <div className="page-heading"><div><div className="eyebrow">YOUR WORKSPACE <span>/</span> PROJECTS</div><h1>Projects</h1><p className="page-subtitle">Every good idea starts with a clear plan.</p></div><button className="button button-primary" onClick={() => openEdit()}><Plus size={16}/> New project</button></div>
    <section className="panel projects-panel" aria-label="Projects">
      <div className="panel-toolbar"><div><h2>All projects</h2><p>Keep an eye on what’s moving forward.</p></div><label className="filter-control"><SlidersHorizontal size={15}/><span className="sr-only">Filter by project status</span><select value={status} onChange={(event) => { setStatus(event.target.value); setCursor(null); setHistory([]); }}><option value="">All statuses</option>{filterStatuses.map((item) => <option key={item} value={item}>{statusLabel(item)}</option>)}</select><ChevronDown size={14} className="select-chevron"/></label></div>
      {statusesQuery.isError && <div className="inline-error" role="status">Status choices may be out of date. Retry to refresh them.<button onClick={() => void statusesQuery.refetch()}>Try again</button></div>}
      {query.isError && query.data && <div className="inline-error" role="status">Couldn’t refresh this list. Showing the last loaded results.<button onClick={() => void query.refetch()}>Try again</button></div>}
      {query.isLoading && !query.data ? <LoadingRows/> : !query.data ? <ErrorState message={query.error?.message ?? "Projects could not be loaded."} onRetry={() => void query.refetch()}/> : projects.length === 0 ? <EmptyState title={!status ? "No projects yet" : `No ${statusLabel(status).toLowerCase()} projects`} description={!status ? "Create a project to give your next idea a home." : "Try another status or clear this filter."} action={!status ? <button className="button button-primary button-small" onClick={() => openEdit()}><Plus size={14}/> Create project</button> : <button className="button button-secondary button-small" onClick={() => { setStatus(""); setCursor(null); setHistory([]); }}>Clear filter</button>}/> : <>
        <div className="table-scroll"><table className="data-table"><thead><tr><th>Project</th><th>Status</th><th>Deadline</th><th className="align-right">Actions</th></tr></thead><tbody>{projects.map((project) => <tr key={project.id}><td><div className="project-name-cell"><button className="project-name-button" onClick={() => openEdit(project)}>{project.title}</button><span>{project.description || "No description"}</span></div></td><td><span className={`status-badge status-${project.status.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}><i/> {statusLabel(project.status)}</span></td><td><span className="date-cell"><CalendarDays size={14}/>{formatDeadline(project.deadline)}</span></td><td><div className="row-actions"><Link className="table-action" href={`/projects/${project.id}`} aria-label={`View details for ${project.title}`} title="View details"><Eye size={15}/></Link><button className="table-action" onClick={() => openEdit(project)} aria-label={`Edit ${project.title}`} title="Edit project"><Pencil size={14}/></button><button className="table-action table-action-danger" onClick={() => setDeleting(project)} aria-label={`Delete ${project.title}`} title="Delete project"><Trash2 size={14}/></button></div></td></tr>)}</tbody></table></div>
        <div className="mobile-project-cards">{projects.map((project) => <article className="project-card" key={project.id}><div className="project-card-head"><span className={`status-badge status-${project.status.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}><i/>{statusLabel(project.status)}</span><button className="table-action" aria-label={`Edit ${project.title}`} onClick={() => openEdit(project)}><Pencil size={14}/></button></div><button className="project-card-title" onClick={() => openEdit(project)}>{project.title}</button><p>{project.description || "No description"}</p><div className="project-card-bottom"><span><CalendarDays size={14}/>{formatDeadline(project.deadline)}</span><div><Link className="table-action" href={`/projects/${project.id}`} aria-label={`View ${project.title}`}><Eye size={15}/></Link><button className="table-action table-action-danger" onClick={() => setDeleting(project)} aria-label={`Delete ${project.title}`}><Trash2 size={14}/></button></div></div></article>)}</div>
        <Pagination cursor={query.data?.page.nextCursor ?? null} history={history} onNext={(next) => { setHistory((items) => [...items, cursor ?? ""]); setCursor(next); }} onPrevious={() => { const previous = [...history]; const next = previous.pop() ?? null; setHistory(previous); setCursor(next || null); }}/>
      </>}
    </section>
    <ProjectFormDialog open={formOpen} project={editing} onClose={() => setFormOpen(false)} onSaved={() => { setCursor(null); setHistory([]); void refresh(); }}/>
    <ConfirmDialog open={Boolean(deleting)} title="Delete this project?" message={`“${deleting?.title ?? "This project"}” and all of its tasks will be permanently deleted.`} endpoint={`/api/projects/${deleting?.id ?? ""}`} onClose={() => setDeleting(null)} onConfirmed={() => { setDeleting(null); setCursor(null); setHistory([]); toast("Project deleted"); void refresh(); }}/>
  </>;
}
