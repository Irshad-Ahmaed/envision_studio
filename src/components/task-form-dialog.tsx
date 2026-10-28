"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { createTaskSchema, type TaskDto, type TaskInput, type TaskValues } from "@/lib/shared/contracts";
import { apiRequest, ApiError } from "@/lib/client/api";
import { Dialog } from "@/components/dialog";
import { useToast } from "@/components/toast";

export function TaskFormDialog({ open, projectId, task, onClose, onSaved }: { open: boolean; projectId: string; task?: TaskDto | null; onClose: () => void; onSaved: () => void }) {
  const [submitError, setSubmitError] = useState("");
  const toast = useToast();
  const form = useForm<TaskInput, unknown, TaskValues>({ resolver: zodResolver(createTaskSchema), defaultValues: { title: "", description: "", completed: false } });
  const { reset } = form;
  useEffect(() => {
    if (!open) return;
    reset(task ? { title: task.title, description: task.description, completed: task.completed } : { title: "", description: "", completed: false });
  }, [open, task, reset]);
  function close() { setSubmitError(""); onClose(); }
  const submit = form.handleSubmit(async (values) => {
    setSubmitError("");
    try {
      const body = task ? { title: values.title, description: values.description, ...(values.completed !== task.completed ? { completed: values.completed } : {}) } : values;
      await apiRequest(task ? `/api/projects/${projectId}/tasks/${task.id}` : `/api/projects/${projectId}/tasks`, { method: task ? "PATCH" : "POST", body: JSON.stringify(body) });
      toast(task ? "Task updated" : "Task added"); onSaved(); onClose();
    } catch (error) {
      if (error instanceof ApiError) {
        setSubmitError(error.message);
        for (const [key, message] of Object.entries(error.fields ?? {})) form.setError(key as keyof TaskInput, { message });
      } else setSubmitError("Something went wrong. Please try again.");
    }
  });
  return <Dialog open={open} onClose={close} disableClose={form.formState.isSubmitting} title={task ? "Edit task" : "Add a task"} description="Break the project into a clear next step.">
    <form className="form-stack" onSubmit={submit}><label className="field"><span>Task name</span><input autoFocus aria-invalid={Boolean(form.formState.errors.title)} {...form.register("title")} placeholder="e.g. Prepare the first draft" />{form.formState.errors.title && <small className="field-error">{form.formState.errors.title.message}</small>}</label><label className="field"><span>Description <em>Optional</em></span><textarea rows={3} {...form.register("description")} placeholder="Add useful context for this task" />{form.formState.errors.description && <small className="field-error">{form.formState.errors.description.message}</small>}</label>{task && <label className="checkbox-field"><input type="checkbox" {...form.register("completed")} /><span>Mark this task as complete</span></label>}{submitError && <p className="form-error" role="alert">{submitError}</p>}<div className="dialog-actions"><button type="button" className="button button-secondary" onClick={close} disabled={form.formState.isSubmitting}>Cancel</button><button className="button button-primary" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Saving…" : task ? "Save changes" : "Add task"}</button></div></form>
  </Dialog>;
}
