import "server-only";
import { backendRequest } from "@/lib/api/server";
import type { ApiOperations } from "@/lib/api/contracts";

export type UnitOption = {
  id: number;
  label: string;
  block?: string | null;
  number?: string;
  residents?: string[];
};

export async function unitOptions(condoId: number): Promise<UnitOption[]> {
  try {
    const [units, people] = await Promise.all([
      backendRequest<ApiOperations["lib.queries.001"]>(`/condominios/${condoId}/opcoes?type=units`),
      backendRequest<ApiOperations["lib.queries.003"]>(`/condominios/${condoId}/opcoes?type=people`),
    ]);

    const residentsByUnit = new Map<number, string[]>();
    if (Array.isArray(people)) {
      for (const p of people) {
        if (p.unitId && p.name) {
          const list = residentsByUnit.get(p.unitId) ?? [];
          if (!list.includes(p.name)) {
            list.push(p.name);
          }
          residentsByUnit.set(p.unitId, list);
        }
      }
    }

    return units.map((r) => {
      const residents = residentsByUnit.get(r.id) ?? [];
      const residentSuffix = residents.length > 0 ? ` — ${residents.join(", ")}` : " (Sem morador cadastrado)";
      return {
        id: r.id,
        label: `${r.block ?? "Sem bloco"} · ${r.number}${residentSuffix}`,
        block: r.block ?? null,
        number: r.number,
        residents,
      };
    });
  } catch {
    const rows = await backendRequest<ApiOperations["lib.queries.001"]>(`/condominios/${condoId}/opcoes?type=units`);
    return rows.map((r) => ({ id: r.id, label: `${r.block ?? "Sem bloco"} · ${r.number}`, residents: [] as string[] }));
  }
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
