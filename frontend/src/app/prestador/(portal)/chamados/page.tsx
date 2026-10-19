import { domainRequest, type ProviderDashboard } from "@/lib/api/domain";
import { requireProvider } from "@/lib/auth";
import { ProviderChamadosClient } from "./chamados-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Meus Chamados · Zeladoria Prestadores",
  description: "Gerencie seus atendimentos, orçamentos e histórico de serviços.",
};

export default async function PrestadorChamadosPage() {
  await requireProvider();
  const data = await domainRequest<ProviderDashboard>("/prestador/chamados");
  return <ProviderChamadosClient vendor={data.vendor} requests={data.requests} quotes={data.quotes} />;
}
