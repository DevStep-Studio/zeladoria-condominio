import { domainRequest, type ProviderEarnings } from "@/lib/api/domain";
import { requireProvider } from "@/lib/auth";
import { ProviderGanhosClient } from "./ganhos-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Ganhos & Financeiro · Zeladoria Prestadores",
  description: "Acompanhe faturamento, serviços concluídos e comissões.",
};

export default async function PrestadorGanhosPage() {
  await requireProvider();
  const data = await domainRequest<ProviderEarnings>("/prestador/ganhos");
  return <ProviderGanhosClient vendor={data.vendor} services={data.services} orders={data.orders} />;
}
