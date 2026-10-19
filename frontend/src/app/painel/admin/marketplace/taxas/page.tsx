import { domainRequest } from "@/lib/api/server";

import { requireRole } from "@/lib/auth";
import { getMarketplaceSettings } from "@/lib/services/payments/payment-service";
import { AdminTaxasClient } from "./taxas-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Zeladoria Pay · Taxas & Split do Marketplace",
  description: "Configure a comissão de intermediação, prazos de retenção e acompanhe repasses.",
};

export default async function AdminMarketplaceTaxasPage() {
  const { session, condoId } = await requireRole(["sindico", "superadmin"]);

  const settings = await getMarketplaceSettings(condoId);

  let recentOrders: any[] = [];
  try {
    recentOrders = await domainRequest<any[]>("/painel/admin/marketplace/taxas", {
      query: { condoId, role: session.role },
    });
  } catch (err) {
    console.warn("Could not query recentOrders for admin taxas:", err);
  }

  return (
    <AdminTaxasClient
      condoId={condoId}
      settings={settings}
      recentOrders={recentOrders}
    />
  );
}
