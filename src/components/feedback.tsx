import { AlertCircle, FolderKanban, RotateCw } from "lucide-react";

export function LoadingRows({ rows = 5 }: { rows?: number }) {
  return <div className="loading-stack" role="status" aria-label="Loading" aria-busy="true">{Array.from({ length: rows }, (_, index) => <div className="skeleton-row" key={index} />)}</div>;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className="state-panel error-state" role="alert"><span className="state-icon"><AlertCircle size={20} /></span><div><strong>We couldn’t load this.</strong><p>{message}</p><button className="button button-secondary button-small" onClick={onRetry}><RotateCw size={14} /> Try again</button></div></div>;
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return <div className="state-panel empty-state"><span className="state-icon"><FolderKanban size={21} /></span><h3>{title}</h3><p>{description}</p>{action}</div>;
}

export function Pagination({ cursor, history, onNext, onPrevious }: { cursor: string | null; history: string[]; onNext: (cursor: string) => void; onPrevious: () => void }) {
  if (!cursor && history.length === 0) return null;
  return <div className="pagination"><span>Page {history.length + 1}</span><div className="pagination-actions"><button className="button button-secondary button-small" onClick={onPrevious} disabled={history.length === 0}>Previous</button><button className="button button-secondary button-small" onClick={() => cursor && onNext(cursor)} disabled={!cursor}>Next</button></div></div>;
}
