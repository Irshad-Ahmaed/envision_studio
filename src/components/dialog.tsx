"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";

export function Dialog({ open, onClose, title, description, children, wide = false, disableClose = false }: {
  open: boolean; onClose: () => void; title: string; description?: string; children: React.ReactNode; wide?: boolean; disableClose?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);
  return <dialog ref={ref} className={`dialog ${wide ? "dialog-wide" : ""}`} aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined} onClose={onClose} onCancel={(event) => { if (disableClose) event.preventDefault(); }} onClick={(event) => { if (!disableClose && event.target === ref.current) onClose(); }}>
    <div className="dialog-heading"><div><h2 id={titleId}>{title}</h2>{description && <p id={descriptionId}>{description}</p>}</div><button className="icon-button" aria-label="Close dialog" onClick={onClose} disabled={disableClose}><X size={18} /></button></div>
    {children}
  </dialog>;
}
