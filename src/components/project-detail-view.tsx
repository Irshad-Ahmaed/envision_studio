"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, Check, CheckCircle2, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { apiRequest } from "@/lib/client/api";
import type { PageDto, ProjectDto, TaskDto } from "@/lib/shared/contracts";
import { statusLabel } from "@/lib/shared/contracts";
import { EmptyState, ErrorState, LoadingRows, Pagination } from "@/components/feedback";
import { ProjectFormDialog } from "@/components/project-form-dialog";
import { TaskFormDialog } from "@/components/task-form-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { formatDeadline } from "@/lib/shared/format";
import { useToast } from "@/components/toast";

export function ProjectDetailView() {
  const params = useParams<{ projectId: string }>(); const router = useRouter(); const id = params.projectId; const client = useQueryClient(); const toast = useToast();
  const [projectFormOpen, setProjectFormOpen] = useState(false); const [taskFormOpen, setTaskFormOpen] = useState(false); const [editingTask, setEditingTask] = useState<TaskDto | null>(null); const [deleteProjectOpen, setDeleteProjectOpen] = useState(false); const [deletingTask, setDeletingTask] = useState<TaskDto | null>(null); const [cursor, setCursor] = useState<string | null>(null); const [history, setHistory] = useState<string[]>([]); const [pendingTask, setPendingTask] = useState(""); const [taskError, setTaskError] = useState("");
  const projectQuery = useQuery({ queryKey: ["project", id], queryFn: () => apiRequest<ProjectDto>(`/api/projects/${id}`) });
  const tasksQuery = useQuery({ queryKey: ["tasks", id, cursor, 25], queryFn: () => apiRequest<PageDto<TaskDto>>(`/api/projects/${id}/tasks?limit=25${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`), enabled: Boolean(projectQuery.data) });
  async function refresh() { await Promise.all([client.invalidateQueries({ queryKey: ["project", id] }), client.invalidateQueries({ queryKey: ["tasks", id] }), client.invalidateQueries({ queryKey: ["dashboard"] }), client.invalidateQueries({ queryKey: ["projects"] })]); }
  async function toggleTask(task: TaskDto) {
    setPendingTask(task.id); setTaskError("");
    try { await apiRequest(`/api/projects/${id}/tasks/${task.id}`, { method: "PATCH", body: JSON.stringify({ completed: !task.completed }) }); await refresh(); }
    catch (error) { setTaskError(error instanceof Error ? error.message : "Could not update the task."); }
    finally { setPendingTask(""); }
  }
  const project = projectQuery.data; const tasks = tasksQuery.data?.data ?? [];
  if (projectQuery.isLoading) return <><div className="back-link-skeleton"/><div className="detail-skeleton"/><LoadingRows rows={4}/></>;
  if (!project) return <><Link className="back-link" href="/projects"><ArrowLeft size={15}/> Back to projects</Link><ErrorState message={projectQuery.error?.message ?? "This project could not be found."} onRetry={() => void projectQuery.refetch()}/></>;
  const completedOnPage = tasks.filter((task) => task.completed).length;
  return <>
    <Link className="back-link" href="/projects"><ArrowLeft size={15}/> All projects</Link>
    {projectQuery.isError && <div className="inline-error" role="status">Couldn’t refresh project details. Showing the last loaded values.<button onClick={() => void projectQuery.refetch()}>Try again</button></div>}
    <section className="detail-hero panel"><div className="detail-kicker"><span className={`status-badge status-${project.status.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}><i/>{statusLabel(project.status)}</span><span className="detail-id">PROJECT / {project.id.slice(-6).toUpperCase()}</span></div><div className="detail-title-row"><div><h1>{project.title}</h1><p>{project.description || "No description has been added yet."}</p></div><div className="detail-actions"><button className="button button-secondary" onClick={() => setProjectFormOpen(true)}><Pencil size={15}/> Edit</button><button className="button button-danger-outline" onClick={() => setDeleteProjectOpen(true)}><Trash2 size={15}/><span className="desktop-only">Delete</span></button></div></div><div className="detail-meta"><span><CalendarDays size={15}/><span>Deadline</span><strong>{formatDeadline(project.deadline)}</strong></span><span><CheckCircle2 size={15}/><span>Tasks on this page</span><strong>{completedOnPage} / {tasks.length} complete</strong></span></div></section>
    <section className="panel task-panel"><div className="panel-toolbar"><div><div className="eyebrow section-eyebrow">MAKE IT HAPPEN</div><h2>Project tasks</h2><p>Small steps add up to meaningful progress.</p></div><button className="button button-primary button-small" onClick={() => { setEditingTask(null); setTaskFormOpen(true); }}><Plus size={15}/> Add task</button></div>
      {tasksQuery.isError && tasksQuery.data && <div className="inline-error" role="status">Couldn’t refresh tasks. Showing the last loaded page.<button onClick={() => void tasksQuery.refetch()}>Try again</button></div>}
      {taskError && <div className="inline-error" role="alert">{taskError}<button onClick={() => setTaskError("")}>Dismiss</button></div>}
      {tasksQuery.isLoading && !tasksQuery.data ? <LoadingRows rows={4}/> : tasksQuery.isError && !tasksQuery.data ? <ErrorState message={tasksQuery.error.message} onRetry={() => void tasksQuery.refetch()}/> : !tasks.length ? <EmptyState title="A clear next step goes a long way" description="Add the first task for this project and start building momentum." action={<button className="button button-primary button-small" onClick={() => setTaskFormOpen(true)}><Plus size={14}/> Add a task</button>}/> : <div className="task-list">{tasks.map((task) => <article className={`task-row ${task.completed ? "task-complete" : ""}`} key={task.id}><button className={`task-checkbox ${task.completed ? "task-checkbox-checked" : ""}`} aria-label={task.completed ? `Mark ${task.title} incomplete` : `Mark ${task.title} complete`} aria-pressed={task.completed} disabled={Boolean(pendingTask)} onClick={() => void toggleTask(task)}>{task.completed ? <Check size={13}/> : <span/>}</button><button className="task-title" onClick={() => { setEditingTask(task); setTaskFormOpen(true); }}><span className="task-title-text">{task.title}</span>{task.description && <span className="task-description">{task.description}</span>}<small>{statusLabel(task.status)}</small></button><div className="task-actions"><button className="table-action" aria-label={`Edit ${task.title}`} onClick={() => { setEditingTask(task); setTaskFormOpen(true); }}><Pencil size={14}/></button><button className="table-action table-action-danger" aria-label={`Delete ${task.title}`} onClick={() => setDeletingTask(task)}><Trash2 size={14}/></button></div></article>)}</div>}
      {Boolean(tasksQuery.data) && tasks.length > 0 && <Pagination cursor={tasksQuery.data?.page.nextCursor ?? null} history={history} onNext={(next) => { setHistory((items) => [...items, cursor ?? ""]); setCursor(next); }} onPrevious={() => { const previous = [...history]; const next = previous.pop() ?? null; setHistory(previous); setCursor(next || null); }}/ >}
    </section>
    <ProjectFormDialog open={projectFormOpen} project={project} onClose={() => setProjectFormOpen(false)} onSaved={() => { void client.invalidateQueries({ queryKey: ["project-statuses"] }); void refresh(); }}/>
    <TaskFormDialog open={taskFormOpen} projectId={id} task={editingTask} onClose={() => setTaskFormOpen(false)} onSaved={() => { setCursor(null); setHistory([]); void refresh(); }}/>
    <ConfirmDialog open={deleteProjectOpen} title="Delete this project?" message={`“${project.title}” and every task in it will be permanently deleted.`} endpoint={`/api/projects/${id}`} onClose={() => setDeleteProjectOpen(false)} onConfirmed={() => { toast("Project deleted"); void client.invalidateQueries({ queryKey: ["project", id] }); void client.invalidateQueries({ queryKey: ["projects"] }); void client.invalidateQueries({ queryKey: ["dashboard"] }); void client.invalidateQueries({ queryKey: ["project-statuses"] }); router.push("/projects"); }}/>
    <ConfirmDialog open={Boolean(deletingTask)} title="Delete this task?" message={`“${deletingTask?.title ?? "This task"}” will be permanently deleted.`} endpoint={`/api/projects/${id}/tasks/${deletingTask?.id ?? ""}`} onClose={() => setDeletingTask(null)} onConfirmed={() => { setDeletingTask(null); toast("Task deleted"); setCursor(null); setHistory([]); void refresh(); }}/>
  </>;
}
