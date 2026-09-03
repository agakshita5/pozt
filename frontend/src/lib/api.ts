import type { Platform, Post, Run, RunSummary, SourceType, Tone } from "./types";

const BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Shown when the API returns no readable message of its own. */
const FALLBACK: Record<string, string> = {
  404: "That is no longer available.",
  429: "Too many requests at once. Wait a moment and try again.",
  500: "Something went wrong on our end. Try again in a moment.",
  502: "The generator is having trouble. Try again in a moment.",
  503: "Post generation is unavailable right now. Try again shortly.",
  504: "That took too long. Try again in a moment.",
  default: "Something went wrong. Try again.",
};

/** Every message the UI shows comes through here, so nothing internal leaks. */
export function errorMessage(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  console.error(e);
  return FALLBACK.default;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch (e) {
    console.error(`${path} failed to reach ${BASE}`, e);
    throw new ApiError(
      "Can't reach Post Studio right now. Check your connection and try again.",
      0,
    );
  }

  if (!res.ok) {
    // The API sends a message written for the reader; anything else it can
    // return is meant for the server log, so it never reaches the screen.
    let detail = "";
    try {
      const body = await res.json();
      if (typeof body.detail === "string") detail = body.detail;
    } catch {
      /* no body to read */
    }
    if (!detail) {
      console.error(`${path} → ${res.status} ${res.statusText}`);
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

export const createRun = (
  sourceType: SourceType,
  source: string,
  tone: Tone,
) =>
  request<Run>("/api/runs", {
    method: "POST",
    body: JSON.stringify({ source_type: sourceType, source, tone }),
  });

export const regeneratePost = (runId: string, platform: Platform, tone: Tone) =>
  request<Post>(`/api/runs/${runId}/regenerate`, {
    method: "POST",
    body: JSON.stringify({ platform, tone }),
  });
