import { domainRequest, type ProviderDashboard } from "@/lib/api/domain";
import { requireProvider } from "@/lib/auth";
import { ProviderDashboardClient } from "./dashboard-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Painel do Prestador · Tião Parceiros",
  description: "Visão geral das solicitações, chamados e agenda de hoje.",
};

export default async function PrestadorDashboardPage() {
  await requireProvider();
  const data = await domainRequest<ProviderDashboard>("/prestador/dashboard");
  return <ProviderDashboardClient vendor={data.vendor} requests={data.requests} quotes={data.quotes} reviews={data.reviews} />;
}
