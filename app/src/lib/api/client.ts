import { env } from "@/lib/env";
import { getCorrelationId } from "@/lib/telemetry";
import type { ApiErrorShape, ApiResponse } from "@/types/api";

export class ApiError extends Error {
  code: string;
  requestId?: string;
  details?: Record<string, unknown>;

  constructor(error: ApiErrorShape) {
    super(error.message);
    this.name = "ApiError";
    this.code = error.code;
    this.requestId = error.requestId;
    this.details = error.details;
  }
}

type ApiFetchOptions = RequestInit & {
  idempotencyKey?: string;
};

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  if (!env.apiBaseUrl) {
    throw new ApiError({ code: "API_BASE_URL_MISSING", message: "API base URL is not configured" });
  }

  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  headers.set("Content-Type", "application/json");
  headers.set("X-Correlation-Id", getCorrelationId());

  if (options.idempotencyKey) {
    headers.set("Idempotency-Key", options.idempotencyKey);
  }

  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    ...options,
    headers,
    credentials: "include",
    cache: "no-store"
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => ({
      code: "HTTP_ERROR",
      message: `Request failed with status ${response.status}`
    }))) as ApiErrorShape;
    throw new ApiError(error);
  }

  const payload = (await response.json()) as ApiResponse<T>;
  return payload.data;
}

export function createIdempotencyKey(prefix: string) {
  const random = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(16).slice(2);
  return `${prefix}_${random}`;
}
