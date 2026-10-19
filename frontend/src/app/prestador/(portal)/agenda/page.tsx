import { domainRequest, type ProviderAgenda } from "@/lib/api/domain";
import { requireProvider } from "@/lib/auth";
import { ProviderAgendaClient } from "./agenda-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Minha Agenda · Zeladoria Prestadores",
  description: "Visualize seus serviços agendados e configure sua disponibilidade.",
};

export default async function PrestadorAgendaPage() {
  await requireProvider();
  const data = await domainRequest<ProviderAgenda>("/prestador/agenda");
  return <ProviderAgendaClient vendor={data.vendor} appointments={data.appointments} />;
}
