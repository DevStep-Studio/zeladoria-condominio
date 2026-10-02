import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { assets, maintenanceOrders, maintenancePlans, vendors } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { ALL_STAFF } from "@/lib/rbac";
import { ensureSeed } from "@/db/seed";
import { ManutencaoClient, type AssetRow, type PlanRow, type OrderRow, type VendorRow } from "./manutencao-client";

export const dynamic = "force-dynamic";

export default async function ManutencaoPage() {
  await ensureSeed();
  const { session, condoId } = await requirePermission("maintenance.view");
  const isStaff = ALL_STAFF.includes(session.role) || session.role === "porteiro";

  const assetRows = await db.select().from(assets).where(eq(assets.condoId, condoId)).orderBy(asc(assets.name));
  const planRows = await db.select().from(maintenancePlans).where(eq(maintenancePlans.condoId, condoId)).orderBy(asc(maintenancePlans.nextDueAt));
  const orderRows = await db
    .select({
      id: maintenanceOrders.id,
      kind: maintenanceOrders.kind,
      title: maintenanceOrders.title,
      status: maintenanceOrders.status,
      scheduledFor: maintenanceOrders.scheduledFor,
      completedAt: maintenanceOrders.completedAt,
      costCents: maintenanceOrders.costCents,
      technician: maintenanceOrders.technician,
      report: maintenanceOrders.report,
      description: maintenanceOrders.description,
      assetId: maintenanceOrders.assetId,
      vendorId: maintenanceOrders.vendorId,
      planId: maintenanceOrders.planId,
      assetName: assets.name,
      vendorName: vendors.name,
    })
    .from(maintenanceOrders)
    .leftJoin(assets, eq(assets.id, maintenanceOrders.assetId))
    .leftJoin(vendors, eq(vendors.id, maintenanceOrders.vendorId))
    .where(eq(maintenanceOrders.condoId, condoId))
    .orderBy(desc(maintenanceOrders.scheduledFor));

  const vendorRows = await db.select().from(vendors).where(eq(vendors.condoId, condoId)).orderBy(asc(vendors.name));

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
