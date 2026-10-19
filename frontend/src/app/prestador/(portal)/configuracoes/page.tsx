import { domainRequest, type ProviderDashboard } from "@/lib/api/domain";
import type { DomainModels } from "@/lib/api/models";

import { requireProvider } from "@/lib/auth";
import { ConfiguracoesClient } from "./configuracoes-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Configurações da Conta · Zeladoria Prestadores",
  description: "Ajuste dados de acesso, preferências de notificações e tipo de conta.",
};

export default async function PrestadorConfiguracoesPage() {
  const { session } = await requireProvider();
  const vendor = await domainRequest<DomainModels["vendors"]>("/prestador/perfil");
  return <ConfiguracoesClient vendor={vendor} user={session.user} />;
}
