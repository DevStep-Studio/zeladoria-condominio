import { domainRequest } from "@/lib/api/server";

import { requireRole } from "@/lib/auth";
import { getMarketplaceSettings } from "@/lib/services/payments/payment-service";
import { ZeladoriaPayAdminClient } from "./zeladoria-pay-admin-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Zeladoria Pay · Administração Financeira do Marketplace",
  description: "Controle de GMV, comissões, vistorias pagas, repasses, contestações e split financeiro.",
};

export default async function AdminZeladoriaPayPage() {
  const { condoId } = await requireRole(["sindico", "superadmin"]);

  const settings = await getMarketplaceSettings(condoId);

  const { orders, disputes, allPayouts, recipients, paidInspections } = await domainRequest<{
    orders: any[];
    disputes: any[];
    allPayouts: any[];
    recipients: any[];
    paidInspections: any[];
  }>("/painel/admin/zeladoria-pay", { query: { condoId } });

  return (
    <ZeladoriaPayAdminClient
      condoId={condoId}
      settings={settings}
      orders={orders}
      disputes={disputes}
      payouts={allPayouts}
      recipients={recipients}
      paidInspections={paidInspections}
    />
  );
}
