import { domainRequest } from "@/lib/api/domain";
import type { DomainModels } from "@/lib/api/models";

import { requireProvider } from "@/lib/auth";
import { DestaqueClient } from "./destaque-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Destaque e Publicidade · Zeladoria Prestadores",
  description: "Promova seu perfil no topo da sua categoria sem distorcer sua reputação orgânica.",
};

export default async function PrestadorDestaquePage() {
  await requireProvider();
  const vendor = await domainRequest<DomainModels["vendors"]>("/prestador/perfil");
  const plans = await domainRequest<DomainModels["promotionPlans"][]>("/prestador/planos");
  const promotions = await domainRequest<DomainModels["providerPromotions"][]>("/prestador/campanhas");
  return <DestaqueClient vendor={vendor} plans={plans.map(p => ({ ...p, badge: p.badge ?? undefined, description: p.description ?? undefined }))} promotions={promotions} />;
}
