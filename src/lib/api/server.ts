import "server-only";
import type { ApiOperations } from "./contracts";

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

function encode(value: unknown): unknown {
  if (value instanceof Date) return { $date: value.toISOString() };
  if (Array.isArray(value)) return value.map(encode);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined).map(([k, v]) => [k, encode(v)]));
  }
  return value;
}

function decode(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(decode);
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (Object.keys(record).length === 1 && typeof record.$date === "string") return new Date(record.$date);
    return Object.fromEntries(Object.entries(record).map(([k, v]) => [k, decode(v)]));
  }
  return value;
}

export async function backendFetch(path: string, options: { method?: string; body?: unknown; token?: string } = {}): Promise<Response> {
  const baseUrl = process.env.BACKEND_API_URL;
  const serviceToken = process.env.BACKEND_SERVICE_TOKEN;
  if (!baseUrl || !serviceToken) throw new Error("Configure BACKEND_API_URL e BACKEND_SERVICE_TOKEN para conectar ao Laravel.");
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}${path}`, {
    method: options.method ?? "GET",
    headers: { "Content-Type": "application/json", Accept: "application/json", "X-Service-Token": serviceToken, ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}) },
    body: options.body === undefined ? undefined : JSON.stringify(encode(options.body)),
    cache: "no-store",
    signal: AbortSignal.timeout(30_000),
  });
  return response;
}

export async function backendRequest<T>(path: string, options: { method?: string; body?: unknown; token?: string } = {}): Promise<T> {
  const response = await backendFetch(path, options);
  if (!response.ok) {
    let message = response.status === 401 ? "Acesso à API não autorizado." : "Não foi possível concluir a operação no backend.";
    if ([403, 404, 409, 422, 429].includes(response.status)) {
      const payload = await response.json().catch(() => null) as { message?: string; errors?: Record<string, string[]> } | null;
      const validation = payload?.errors ? Object.values(payload.errors).flat()[0] : undefined;
      if (validation || payload?.message) message = validation ?? payload!.message!;
    }
    throw new ApiError(response.status, message);
  }
  const payload = await response.json() as { data: unknown };
  return decode(payload.data) as T;
}

/** Private service calls from Next.js to Laravel. There is no database runtime in the frontend. */
export function apiOperation<K extends keyof ApiOperations>(operation: K, parameters: unknown[]): Promise<ApiOperations[K]> {
  return backendRequest<ApiOperations[K]>(`/operations/${encodeURIComponent(operation)}`, { method: "POST", body: { parameters } });
}

export { domainRequest, domainAction } from "./domain";
