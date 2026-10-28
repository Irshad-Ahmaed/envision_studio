"use client";

import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, Plus } from "lucide-react";
import { DashboardMetrics } from "@/components/dashboard-metrics";
import { DashboardRecentProjects } from "@/components/dashboard-recent-projects";
import { ProjectFormDialog } from "@/components/project-form-dialog";

export function DashboardView() {
  const client = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const openProjectForm = useCallback(() => setFormOpen(true), []);

  useEffect(() => {
    window.addEventListener("open-new-project", openProjectForm);
    return () => window.removeEventListener("open-new-project", openProjectForm);
  }, [openProjectForm]);

  const refreshAfterSave = useCallback(() => {
    void client.invalidateQueries({ queryKey: ["dashboard"] });
    void client.invalidateQueries({ queryKey: ["projects"] });
    void client.invalidateQueries({ queryKey: ["project-statuses"] });
  }, [client]);

  return (
    <>
      <div className="page-heading dashboard-heading">
        <div>
          <div className="eyebrow">YOUR WORKSPACE <span>/</span> OVERVIEW</div>
          <h1>Good work starts here.</h1>
          <p className="page-subtitle">A calm view of everything your team is moving forward.</p>
        </div>
        <button className="button button-primary" onClick={openProjectForm}><Plus size={16} /> New project</button>
      </div>
      <DashboardMetrics />
      <DashboardRecentProjects onCreate={openProjectForm} />
      <div className="dashboard-note">
        <span className="note-icon"><ArrowUpRight size={15} /></span>
        <p>Your project health, at a glance. Counts update as your team completes tasks.</p>
        <span className="note-accent">STAY IN FLOW</span>
      </div>
      <ProjectFormDialog open={formOpen} onClose={() => setFormOpen(false)} onSaved={refreshAfterSave} />
    </>
  );
}
