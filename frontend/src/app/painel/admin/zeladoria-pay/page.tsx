import { domainRequest } from "@/lib/api/server";

import { requireRole } from "@/lib/auth";
import { getMarketplaceSettings } from "@/lib/services/payments/payment-service";
import { ZeladoriaPayAdminClient } from "./zeladoria-pay-admin-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Zeladoria Pay · Administração Financeira do Marketplace",
  description: "Controle de GMV, comissões, vistorias pagas, repasses, contestações e split financeiro.",
};

export default async function AdminZeladoriaPayPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const { condoId } = await requireRole(["sindico", "superadmin"]);
  const params = (await searchParams) ?? {};

  let settings: any = {
    commissionPercent: 10,
    slotHoldMinutes: 10,
    inspectionFeeMaxCents: 15000,
    disputeWindowHours: 48,
    autoReleaseHours: 72,
  };
  try {
    settings = await getMarketplaceSettings(condoId);
  } catch (err) {
    console.error("[Zeladoria Pay] Erro ao carregar settings:", err);
  }

  let data: {
    orders: any[];
    disputes: any[];
    allPayouts: any[];
    recipients: any[];
    paidInspections: any[];
  } = {
    orders: [],
    disputes: [],
    allPayouts: [],
    recipients: [],
    paidInspections: [],
  };
  try {
    const res = await domainRequest<{
      orders?: any[];
      disputes?: any[];
      allPayouts?: any[];
      recipients?: any[];
      paidInspections?: any[];
    }>("/painel/admin/zeladoria-pay", { query: { condoId: condoId > 0 ? condoId : undefined } });
    if (res) {
      data = {
        orders: Array.isArray(res.orders) ? res.orders : [],
        disputes: Array.isArray(res.disputes) ? res.disputes : [],
        allPayouts: Array.isArray(res.allPayouts) ? res.allPayouts : [],
        recipients: Array.isArray(res.recipients) ? res.recipients : [],
        paidInspections: Array.isArray(res.paidInspections) ? res.paidInspections : [],
      };
    }
  } catch (err) {
    console.error("[Zeladoria Pay] Erro ao carregar dados do backend:", err);
  }

  return (
    <ZeladoriaPayAdminClient
      condoId={condoId}
      settings={settings}
      orders={data.orders}
      disputes={data.disputes}
      payouts={data.allPayouts}
      recipients={data.recipients}
      paidInspections={data.paidInspections}
      initialTab={params.tab}
    />
  );
}
