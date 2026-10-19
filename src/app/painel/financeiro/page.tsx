import { domainRequest } from "@/lib/api/server";

import { requirePermission } from "@/lib/auth";

import { FinanceiroClient } from "./financeiro-client";

export const dynamic = "force-dynamic";

export default async function FinanceiroPage() {
  const { session, condo, condoId } = await requirePermission("financial.view");
  const currentYear = new Date().getFullYear();

  const { txRows, chargeRows, budgetRows, vendorRows } = await domainRequest<{
    txRows: any[];
    chargeRows: any[];
    budgetRows: any[];
    vendorRows: any[];
  }>("/painel/financeiro", { query: { condoId, role: session.role } });

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

