import { domainRequest } from "@/lib/api/server";

import { requirePermission } from "@/lib/auth";
import { ALL_STAFF } from "@/lib/rbac";

import { ManutencaoClient, type AssetRow, type PlanRow, type OrderRow, type VendorRow } from "./manutencao-client";

export const dynamic = "force-dynamic";

export default async function ManutencaoPage() {
  const { session, condoId } = await requirePermission("maintenance.view");
  const isStaff = ALL_STAFF.includes(session.role) || session.role === "porteiro";

  const { assetRows, planRows, orderRows, vendorRows } = await domainRequest<{
    assetRows: any[];
    planRows: any[];
    orderRows: any[];
    vendorRows: any[];
  }>("/painel/manutencao", { query: { condoId, role: session.role } });

  const safeAssets: AssetRow[] = assetRows.map((a) => ({
    id: a.id,
    condoId: a.condoId,
    name: a.name,
    category: a.category,
    location: a.location,
    brand: a.brand,
    serial: a.serial,
    installedAt: a.installedAt,
    status: a.status,
    notes: a.notes,
  }));

  const safePlans: PlanRow[] = planRows.map((p) => ({
    id: p.id,
    condoId: p.condoId,
    assetId: p.assetId,
    title: p.title,
    frequencyDays: p.frequencyDays,
    checklist: Array.isArray(p.checklist) ? (p.checklist as string[]) : [],
    vendorId: p.vendorId,
    responsible: p.responsible,
    nextDueAt: p.nextDueAt,
    lastDoneAt: p.lastDoneAt,
    active: p.active,
  }));

  const safeOrders: OrderRow[] = orderRows.map((o) => ({
    id: o.id,
    kind: o.kind,
    title: o.title,
    status: o.status,
    scheduledFor: o.scheduledFor,
    completedAt: o.completedAt,
    costCents: o.costCents,
    technician: o.technician,
    report: o.report,
    description: o.description,
    assetId: o.assetId,
    vendorId: o.vendorId,
    planId: o.planId,
    assetName: o.assetName,
    vendorName: o.vendorName,
  }));

  const safeVendors: VendorRow[] = vendorRows.map((v) => ({
    id: v.id,
    name: v.name,
    category: v.category,
    phone: v.phone,
    email: v.email,
  }));

  return (
    <ManutencaoClient
      assets={safeAssets}
      plans={safePlans}
      orders={safeOrders}
      vendors={safeVendors}
      isStaff={isStaff}
    />
  );
}
