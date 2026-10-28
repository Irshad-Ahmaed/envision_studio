"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { CheckCircle2, X } from "lucide-react";

type ToastContextValue = (message: string) => void;
const ToastContext = createContext<ToastContextValue>(() => undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState("");
  const timer = useRef<number | null>(null);
  useEffect(() => () => { if (timer.current !== null) window.clearTimeout(timer.current); }, []);
  const toast = useCallback((text: string) => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    setMessage(text);
    timer.current = window.setTimeout(() => setMessage(""), 3200);
  }, []);
  return <ToastContext.Provider value={toast}>{children}{message && <div className="toast" role="status"><CheckCircle2 size={17} /><span>{message}</span><button aria-label="Dismiss notification" onClick={() => setMessage("")}><X size={15} /></button></div>}</ToastContext.Provider>;
}

export const useToast = () => useContext(ToastContext);
