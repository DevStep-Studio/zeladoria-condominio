import { domainRequest, type ProviderDashboard } from "@/lib/api/domain";
import type { DomainModels } from "@/lib/api/models";

import { requireProvider } from "@/lib/auth";
import { PortfolioClient } from "./portfolio-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Portfólio de Trabalhos · Zeladoria Prestadores",
  description: "Cadastre e gerencie fotos dos seus trabalhos realizados com títulos e categorias.",
};

export default async function PrestadorPortfolioPage() {
  const { session } = await requireProvider();
  const vendor = await domainRequest<DomainModels["vendors"]>("/prestador/perfil");
  return <PortfolioClient vendor={vendor} />;
}
