export class ApiError extends Error {
  constructor(message: string, public status: number, public fields?: Record<string, string>) { super(message); }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function fieldErrors(value: unknown): Record<string, string> | undefined {
  if (!isRecord(value)) return undefined;
  const entries = Object.entries(value);
  if (!entries.every(([, message]) => typeof message === "string")) return undefined;
  return Object.fromEntries(entries) as Record<string, string>;
}

export async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body !== undefined && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const response = await fetch(url, { ...init, headers, cache: "no-store" });
  if (response.status === 204) return undefined as T;
  let result: unknown;
  try { result = await response.json(); }
  catch { throw new ApiError("The server returned an unexpected response. Please try again.", response.status); }
  if (!response.ok) {
    const error = isRecord(result) && isRecord(result.error) ? result.error : {};
    const message = typeof error.message === "string" ? error.message : "The request could not be completed.";
    throw new ApiError(message, response.status, fieldErrors(error.fields));
  }
  if (!isRecord(result) || !Object.hasOwn(result, "data")) {
    throw new ApiError("The server returned an unexpected response. Please try again.", response.status);
  }
  return result.data as T;
}
