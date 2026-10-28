import { statusLabel } from "./contracts";

export function normalizeStatus(status: string): string {
  const value = status.trim().toLowerCase();
  return value.replace(/[\s_-]+/g, " ").trim() || value;
}

export function uniqueStatuses(statuses: readonly string[]): string[] {
  const values = new Map<string, string>();
  for (const status of statuses) {
    const value = status.trim();
    const key = normalizeStatus(value);
    if (value && !values.has(key)) values.set(key, value);
  }
  return Array.from(values.values()).sort((a, b) => statusLabel(a).localeCompare(statusLabel(b)));
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function statusMatchPattern(status: string): RegExp {
  const parts = status.trim().split(/[\s_-]+/).filter(Boolean);
  const pattern = parts.length ? parts.map(escapeRegex).join("[\\s_-]+") : escapeRegex(status.trim());
  return new RegExp(`^${pattern}$`, "i");
}
