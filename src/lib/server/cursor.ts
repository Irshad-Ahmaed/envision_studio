import "server-only";
import { badRequest } from "@/lib/server/http";

type Cursor = { createdAt: string; id: string; scope: string };
export function encodeCursor(value: Cursor) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

export function decodeCursor(value: string | null, scope: string): Cursor | null {
  if (!value) return null;
  try {
    if (value.length > 512) throw new Error();
    const decoded = Buffer.from(value, "base64url");
    if (decoded.toString("base64url") !== value) throw new Error();
    const parsed = JSON.parse(decoded.toString("utf8")) as Partial<Cursor>;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
    if (typeof parsed.createdAt !== "string" || new Date(parsed.createdAt).toISOString() !== parsed.createdAt) throw new Error();
    if (typeof parsed.id !== "string" || !/^[a-f\d]{24}$/i.test(parsed.id)) throw new Error();
    if (parsed.scope !== scope) throw new Error();
    if (Object.keys(parsed).sort().join(",") !== "createdAt,id,scope") throw new Error();
    return parsed as Cursor;
  } catch {
    throw badRequest("This page link is invalid. Start again from the first page.", "INVALID_CURSOR");
  }
}

export function parseLimit(value: string | null) {
  if (value === null) return 25;
  if (!/^\d+$/.test(value)) throw badRequest("Page size must be a whole number.", "INVALID_LIMIT");
  const limit = Number(value);
  if (limit < 1 || limit > 100) throw badRequest("Page size must be between 1 and 100.", "INVALID_LIMIT");
  return limit;
}
