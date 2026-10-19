import "server-only";
import { backendRequest } from "@/lib/api/server";
import type { ApiOperations } from "@/lib/api/contracts";

export async function unitOptions(condoId: number) {
  const rows = await backendRequest<ApiOperations["lib.queries.001"]>(`/condominios/${condoId}/opcoes?type=units`);
  return rows.map((r) => ({ id: r.id, label: `${r.block ?? "Sem bloco"} · ${r.number}` }));
}

export async function blockOptions(condoId: number) {
  return backendRequest<ApiOperations["lib.queries.002"]>(`/condominios/${condoId}/opcoes?type=blocks`);
}

export async function peopleOptions(condoId: number, roles?: string[]) {
  const params = new URLSearchParams({ type: "people" });
  for (const role of roles ?? []) params.append("roles[]", role);
  return backendRequest<ApiOperations["lib.queries.003"]>(`/condominios/${condoId}/opcoes?${params.toString()}`);
}

export function unitLabelMap(list: { id: number; label: string }[]) {
  const map = new Map<number, string>();
  for (const item of list) map.set(item.id, item.label);
  return map;
}
