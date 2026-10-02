import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { blocks, budgets, charges, transactions, units, vendors } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { ensureSeed } from "@/db/seed";
import { FinanceiroClient } from "./financeiro-client";

export const dynamic = "force-dynamic";

export default async function FinanceiroPage() {
  await ensureSeed();
  const { session, condo, condoId } = await requirePermission("financial.view");
  const currentYear = new Date().getFullYear();

  const txRows = await db
    .select({
      id: transactions.id,
      kind: transactions.kind,
      category: transactions.category,
      costCenter: transactions.costCenter,
      description: transactions.description,
      amountCents: transactions.amountCents,
      dueDate: transactions.dueDate,
      paidDate: transactions.paidDate,
      status: transactions.status,
      reserveFund: transactions.reserveFund,
      vendorName: vendors.name,
      attachmentUrl: transactions.attachmentUrl,
    })
    .from(transactions)
    .leftJoin(vendors, eq(vendors.id, transactions.vendorId))
    .where(eq(transactions.condoId, condoId))
    .orderBy(desc(transactions.dueDate))
    .limit(200);

  const chargeRows = await db
    .select({
      id: charges.id,
      reference: charges.reference,
      amountCents: charges.amountCents,
      dueDate: charges.dueDate,
      status: charges.status,
      unit: units.number,
      block: blocks.name,
      method: charges.method,
    })
    .from(charges)
    .leftJoin(units, eq(units.id, charges.unitId))
    .leftJoin(blocks, eq(blocks.id, units.blockId))
    .where(eq(charges.condoId, condoId))
    .orderBy(desc(charges.dueDate))
    .limit(300);

  const budgetRows = await db
    .select({
      id: budgets.id,
      category: budgets.category,
      plannedCents: budgets.plannedCents,
      year: budgets.year,
    })
    .from(budgets)
    .where(eq(budgets.condoId, condoId))
    .orderBy(asc(budgets.category));

  const vendorRows = await db
    .select({
      id: vendors.id,
      name: vendors.name,
      category: vendors.category,
    })
    .from(vendors)
    .where(eq(vendors.condoId, condoId))
    .orderBy(asc(vendors.name));

  const canManage = session.role === "sindico" || session.role === "superadmin" || session.role === "conselho";

  return (
    <FinanceiroClient
      condoName={condo.name}
      transactions={txRows.map((t) => ({
        ...t,
        kind: (t.kind === "receita" ? "receita" : "despesa") as "receita" | "despesa",
      }))}
      charges={chargeRows}
      budgets={budgetRows}
      vendors={vendorRows}
      currentYear={currentYear}
      canManage={canManage}
    />
  );
}

