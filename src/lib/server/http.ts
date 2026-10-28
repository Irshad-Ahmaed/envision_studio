import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class HttpError extends Error {
  constructor(public status: number, public code: string, message: string, public fields?: Record<string, string>) {
    super(message);
  }
}

export function jsonData(data: unknown, status = 200, headers?: Record<string, string>) {
  return NextResponse.json({ data }, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

export function errorResponse(error: unknown, requestId: string) {
  if (error instanceof ZodError) {
    const fields: Record<string, string> = {};
    for (const issue of error.issues) {
      const key = issue.path[0]?.toString() ?? "_form";
      fields[key] ??= issue.message;
    }
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Check the submitted values.", fields, requestId } }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
  if (error instanceof HttpError) {
    return NextResponse.json({ error: { code: error.code, message: error.message, ...(error.fields ? { fields: error.fields } : {}), requestId } }, { status: error.status, headers: { "Cache-Control": "no-store" } });
  }
  if (error instanceof Error && error.name === "ValidationError") {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Check the submitted values.", requestId } }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
  if (error instanceof Error && /MongooseServerSelectionError|MongoServerSelectionError|MongoNetworkError|MongoNetworkTimeoutError|MongoServerTimeoutError/.test(error.name)) {
    console.error(JSON.stringify({ requestId, category: "database_unavailable", errorType: error.name }));
    return NextResponse.json({ error: { code: "DATABASE_UNAVAILABLE", message: "The database is temporarily unavailable. Please try again.", requestId } }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  if (error instanceof Error && (error as Error & { code?: number }).code === 20) {
    console.error(JSON.stringify({ requestId, category: "transactions_unavailable", errorType: error.name }));
    return NextResponse.json({ error: { code: "TRANSACTIONS_UNAVAILABLE", message: "This database does not support the operation. Use a replica set and try again.", requestId } }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  console.error(JSON.stringify({ requestId, category: "unhandled_api_error", errorType: error instanceof Error ? error.name : "UnknownError" }));
  return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Something went wrong. Please try again.", requestId } }, { status: 500, headers: { "Cache-Control": "no-store" } });
}

export function badRequest(message: string, code = "BAD_REQUEST") {
  return new HttpError(400, code, message);
}

export function assertObjectId(value: string) {
  if (!/^[a-f\d]{24}$/i.test(value)) throw badRequest("The requested ID is invalid.", "INVALID_ID");
}

export async function readJson(request: Request) {
  const contentType = request.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
  if (contentType !== "application/json") throw new HttpError(415, "UNSUPPORTED_MEDIA_TYPE", "Send a JSON request body.");
  const reader = request.body?.getReader();
  if (!reader) throw badRequest("A JSON request body is required.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 16_384) {
        await reader.cancel().catch(() => undefined);
        throw new HttpError(413, "BODY_TOO_LARGE", "The request body is too large.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  try {
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
  } catch {
    throw badRequest("The JSON body is malformed.", "INVALID_JSON");
  }
}

export function assertAllowedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) throw new HttpError(403, "ORIGIN_REQUIRED", "A trusted browser origin is required for this change.");
  const allowlist = (process.env.APP_ALLOWED_ORIGINS ?? "http://localhost:3000").split(",").map((item) => item.trim()).filter(Boolean);
  if (!allowlist.includes(origin)) throw new HttpError(403, "ORIGIN_NOT_ALLOWED", "This origin cannot submit changes.");
}

export function assertOnlyQueryKeys(url: URL, allowed: string[]) {
  const accepted = new Set(allowed);
  for (const key of url.searchParams.keys()) {
    if (!accepted.has(key) || url.searchParams.getAll(key).length !== 1) throw badRequest("The query contains an unsupported or repeated parameter.", "UNKNOWN_QUERY_PARAMETER");
  }
}

export async function api<T>(request: Request, action: () => Promise<T>, status = 200, mutate = false) {
  const requestId = crypto.randomUUID();
  try {
    if (mutate) assertAllowedOrigin(request);
    const result = await action();
    if (status === 204) return new NextResponse(null, { status, headers: { "Cache-Control": "no-store", "X-Request-Id": requestId } });
    return jsonData(result, status, { "X-Request-Id": requestId });
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
