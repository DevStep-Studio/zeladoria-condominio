import { domainRequest, type ProviderDashboard } from "@/lib/api/domain";
import type { DomainModels } from "@/lib/api/models";

import { requireProvider } from "@/lib/auth";
import { DisponibilidadeClient } from "./disponibilidade-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Disponibilidade e Horários · Zeladoria Prestadores",
  description: "Configure sua disponibilidade imediata (ON/OFF), dias de atendimento e raio de cobertura.",
};

export default async function PrestadorDisponibilidadePage() {
  const { session } = await requireProvider();
  const vendor = await domainRequest<DomainModels["vendors"]>("/prestador/perfil");
  return <DisponibilidadeClient vendor={vendor} />;
}
