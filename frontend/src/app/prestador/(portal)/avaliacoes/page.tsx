import { domainRequest, type ProviderDashboard } from "@/lib/api/domain";
import type { DomainModels } from "@/lib/api/models";

import { requireProvider } from "@/lib/auth";
import { AvaliacoesClient } from "./avaliacoes-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Avaliações e Reputação · Zeladoria Prestadores",
  description: "Acompanhe suas avaliações verificadas de atendimentos concluídos no condomínio.",
};

export default async function PrestadorAvaliacoesPage() {
  const { session } = await requireProvider();
  const vendor = await domainRequest<DomainModels["vendors"]>("/prestador/perfil");
  const reviews = await domainRequest<ProviderDashboard["reviews"]>("/prestador/avaliacoes");
  return <AvaliacoesClient vendor={vendor} reviews={reviews} />;
}
