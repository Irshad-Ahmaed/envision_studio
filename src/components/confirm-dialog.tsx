"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Dialog } from "@/components/dialog";
import { apiRequest, ApiError } from "@/lib/client/api";

export function ConfirmDialog({ open, title, message, endpoint, onClose, onConfirmed }: { open: boolean; title: string; message: string; endpoint: string; onClose: () => void; onConfirmed: () => void }) {
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  function close() { setError(""); onClose(); }
  async function confirm() {
    setBusy(true); setError("");
    try { await apiRequest(endpoint, { method: "DELETE" }); onConfirmed(); close(); }
    catch (cause) { setError(cause instanceof ApiError ? cause.message : "Could not delete this item. Please try again."); }
    finally { setBusy(false); }
  }
  return <Dialog open={open} onClose={close} disableClose={busy} title={title}><div className="confirm-body"><span className="danger-icon"><AlertTriangle size={20} /></span><p>{message}</p></div>{error && <p className="form-error" role="alert">{error}</p>}<div className="dialog-actions"><button className="button button-secondary" onClick={close} disabled={busy}>Cancel</button><button className="button button-danger" onClick={confirm} disabled={busy}>{busy ? "Deleting…" : "Delete"}</button></div></Dialog>;
}
