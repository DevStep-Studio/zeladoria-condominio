import { domainRequest } from "@/lib/api/server";

import { requireSession } from "@/lib/auth";
import { DEFAULT_PROMOTION_PLANS } from "@/lib/services/promotions";
import { AdminDestaquesClient } from "./admin-destaques-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Gestão de Destaques · Admin Marketplace",
  description: "Gerencie planos de publicidade, campanhas ativas e receita do marketplace.",
};

export default async function AdminMarketplaceDestaquesPage() {
  const session = await requireSession();
  const condoId = session.condo?.id ?? null;

  let plans: any[] = [];
  let campaigns: any[] = [];
  try {
    const res = await domainRequest<{ plans: any[]; campaigns: any[] }>(
      "/painel/admin/marketplace/destaques",
      { query: { condoId } }
    );
    plans = res.plans;
    campaigns = res.campaigns;
  } catch {
    plans = [];
    campaigns = [];
  }
  if (!plans.length) {
    plans = DEFAULT_PROMOTION_PLANS;
  }

  return (
    <AdminDestaquesClient
      plans={plans}
      campaigns={campaigns}
    />
  );
}
