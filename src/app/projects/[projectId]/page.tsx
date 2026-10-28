import type { Metadata } from "next";
import { ProjectDetailView } from "@/components/project-detail-view";

export const metadata: Metadata = { title: "Project details" };
export default function ProjectDetailsPage() { return <div className="page-content detail-page"><ProjectDetailView/></div>; }
