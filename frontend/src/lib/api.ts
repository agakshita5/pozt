import type { Platform, Post, Run, RunSummary, SourceType, Tone } from "./types";

const DEV = process.env.NODE_ENV === "development";

const BASE = "/api/backend";

type TokenGetter = () => Promise<string | null>;
let getToken: TokenGetter | null = null;

export function setTokenGetter(fn: TokenGetter | null) {
  getToken = fn;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const OFFLINE = DEV
  ? "Cannot reach the backend. Start it with: cd backend && ../venv/bin/uvicorn main:app --reload --port 8000"
  : "Can't reach PoZt right now. Check your connection and try again.";

// shown when the API returns no readable message of its own
const FALLBACK: Record<string, string> = {
  401: "Please sign in to continue.",
  404: "That is no longer available.",
  429: "Too many requests at once. Wait a moment and try again.",
  500: "Something went wrong on our end. Try again in a moment.",
  502: "The generator is having trouble. Try again in a moment.",
  503: "Post generation is unavailable right now. Try again shortly.",
  504: "That took too long. Try again in a moment.",
  default: "Something went wrong. Try again.",
};

export function errorMessage(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  console.error(e);
  return FALLBACK.default;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken ? await getToken().catch(() => null) : null;

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    });
  } catch (e) {
    console.error(`${path} failed`, e);
    throw new ApiError(OFFLINE, 0);
  }

  if (!res.ok) {
    let detail = "";
    try {
      const body = await res.json();
      if (typeof body.detail === "string") detail = body.detail;
    } catch {
      /* no body to read */
    }
    if (!detail) {
      console.error(`${path} -> ${res.status} ${res.statusText}`);
      detail = FALLBACK[res.status] ?? FALLBACK.default;
    }
    throw new ApiError(detail, res.status);
  }
  return res.json() as Promise<T>;
}

export const listRuns = () => request<RunSummary[]>("/api/runs");

export const getRun = (id: string) => request<Run>(`/api/runs/${id}`);

export const deleteRun = (id: string) =>
  request<{ deleted: string }>(`/api/runs/${id}`, { method: "DELETE" });

export const createRun = ( sourceType: SourceType, source: string, tone: Tone) =>
  request<Run>("/api/runs", {
    method: "POST",
    body: JSON.stringify({ source_type: sourceType, source, tone }),
  });

export const regeneratePost = (runId: string, platform: Platform, tone: Tone) =>
  request<Post>(`/api/runs/${runId}/regenerate`, {
    method: "POST",
    body: JSON.stringify({ platform, tone }),
  });
