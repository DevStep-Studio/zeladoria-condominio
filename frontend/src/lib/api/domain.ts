import "server-only";
import { cookies } from "next/headers";
import { backendRequest, ApiError } from "./server";
import type { DomainModels } from "./models";
import type { ApiOperations } from "./contracts";

export type ProviderDashboard = {
  vendor: DomainModels["vendors"];
  requests: ApiOperations["app.prestador.-portal-.chamados.page.002"];
  quotes: DomainModels["serviceQuotes"][];
  reviews: (DomainModels["serviceReviews"] & { authorName: string; customerName: string })[];
};
export type ProviderAgenda = { vendor: DomainModels["vendors"]; appointments: ApiOperations["app.prestador.-portal-.agenda.page.002"] };
export type ProviderEarnings = { vendor: DomainModels["vendors"]; services: DomainModels["serviceRequests"][]; orders: DomainModels["paymentOrders"][] };
export type ServicePanel = {
  services: ApiOperations["app.painel.servicos.page.009"];
  marketplaceRequests: ApiOperations["app.painel.servicos.page.001"];
  quotes: ApiOperations["app.painel.servicos.page.002"];
  reviews: DomainModels["serviceReviews"][];
  messages: ApiOperations["app.painel.servicos.page.005"];
  evidences: DomainModels["serviceEvidences"][];
  inspections: DomainModels["serviceInspections"][];
  paymentOrders: DomainModels["paymentOrders"][];
  addendums: DomainModels["contractAddendums"][];
  vendors: DomainModels["vendors"][];
  initialFavorites: number[];
  condoInfo: ApiOperations["app.painel.servicos.page.010"][number];
};

/** Domain routes authenticate the user in Laravel; the client never supplies a vendor or user identity. */
export async function domainRequest<T = any>(
  path: string,
  options: { method?: string; body?: unknown; query?: Record<string, unknown> } = {}
): Promise<T> {
  const jar = await cookies();
  const url = new URL(path, "http://backend.internal");
  if (options.query) {
    for (const [k, v] of Object.entries(options.query)) {
      if (v !== undefined && v !== null && v !== "") {
        url.searchParams.set(k, String(v));
      }
    }
  }
  if (jar.get("gc_condo")?.value && !url.searchParams.has("condoId")) url.searchParams.set("condoId", jar.get("gc_condo")!.value);
  if (jar.get("gc_role")?.value && !url.searchParams.has("role")) url.searchParams.set("role", jar.get("gc_role")!.value);
  return backendRequest<T>(url.pathname + url.search, { method: options.method, body: options.body, token: jar.get("gc_session")?.value });
}

export async function domainAction<T extends { success: boolean } = { success: boolean; error?: string }>(path: string, method: string, body?: unknown): Promise<T | { success: false; error: string }> {
  try { return await domainRequest<T>(path, { method, body }); }
  catch (error) {
    if (error instanceof ApiError && [401, 403, 404, 409, 422, 429].includes(error.status)) return { success: false, error: error.message };
    throw error;
  }
}
