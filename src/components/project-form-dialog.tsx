"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { createProjectSchema, projectStatuses, statusLabel, type ProjectDto, type ProjectInput } from "@/lib/shared/contracts";
import { uniqueStatuses } from "@/lib/shared/statuses";
import { apiRequest, ApiError } from "@/lib/client/api";
import { Dialog } from "@/components/dialog";
import { useToast } from "@/components/toast";

export function ProjectFormDialog({ open, project, onClose, onSaved }: { open: boolean; project?: ProjectDto | null; onClose: () => void; onSaved: () => void }) {
  const [submitError, setSubmitError] = useState("");
  const toast = useToast();
  const statuses = useQuery({ queryKey: ["project-statuses"], queryFn: () => apiRequest<string[]>("/api/projects/statuses"), enabled: open });
  const availableStatuses = uniqueStatuses([...(project ? [project.status] : []), ...projectStatuses, ...(statuses.data ?? [])]);
  const form = useForm<ProjectInput>({ resolver: zodResolver(createProjectSchema), defaultValues: { title: "", description: "", status: "active", deadline: "" } });
  const { reset } = form;
  useEffect(() => {
    if (!open) return;
    reset(project ? { title: project.title, description: project.description, status: project.status, deadline: project.deadline } : { title: "", description: "", status: "active", deadline: "" });
  }, [open, project, reset]);
  function close() { setSubmitError(""); onClose(); }

  const submit = form.handleSubmit(async (values) => {
    setSubmitError("");
    try {
      await apiRequest(project ? `/api/projects/${project.id}` : "/api/projects", { method: project ? "PATCH" : "POST", body: JSON.stringify(values) });
      toast(project ? "Project updated" : "Project created");
      onSaved(); onClose();
    } catch (error) {
      if (error instanceof ApiError) {
        setSubmitError(error.message);
        for (const [key, message] of Object.entries(error.fields ?? {})) form.setError(key as keyof ProjectInput, { message });
      } else setSubmitError("Something went wrong. Please try again.");
    }
  });

  return <Dialog open={open} onClose={close} disableClose={form.formState.isSubmitting} title={project ? "Edit project" : "New project"} description="Keep the essentials clear so your team can stay focused." wide>
    <form className="form-stack" onSubmit={submit}>
      <label className="field"><span>Project title</span><input autoFocus {...form.register("title")} placeholder="e.g. Brand refresh" aria-invalid={Boolean(form.formState.errors.title)} />{form.formState.errors.title && <small className="field-error">{form.formState.errors.title.message}</small>}</label>
      <label className="field"><span>Description <em>Optional</em></span><textarea rows={4} {...form.register("description")} placeholder="What are we working toward?" />{form.formState.errors.description && <small className="field-error">{form.formState.errors.description.message}</small>}</label>
      <div className="form-grid"><label className="field"><span>Status</span><select {...form.register("status")}>{availableStatuses.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</select></label><label className="field"><span>Deadline</span><input type="date" {...form.register("deadline")} aria-invalid={Boolean(form.formState.errors.deadline)} />{form.formState.errors.deadline && <small className="field-error">{form.formState.errors.deadline.message}</small>}</label></div>
      {submitError && <p className="form-error" role="alert">{submitError}</p>}
      <div className="dialog-actions"><button type="button" className="button button-secondary" onClick={close} disabled={form.formState.isSubmitting}>Cancel</button><button className="button button-primary" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Saving…" : project ? "Save changes" : "Create project"}</button></div>
    </form>
  </Dialog>;
}
