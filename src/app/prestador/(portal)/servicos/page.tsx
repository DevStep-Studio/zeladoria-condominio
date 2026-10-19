import { domainRequest, type ProviderDashboard } from "@/lib/api/domain";
import type { DomainModels } from "@/lib/api/models";

import { requireProvider } from "@/lib/auth";
import { ProviderServicosEditorClient } from "./servicos-editor-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Meus Serviços & Catálogo · Zeladoria Prestadores",
  description: "Gerencie seu catálogo de serviços e faixas de preço para os condomínios.",
};

export default async function PrestadorServicosPage() {
  const { session } = await requireProvider();
  const vendor = await domainRequest<DomainModels["vendors"]>("/prestador/perfil");
  return <ProviderServicosEditorClient vendor={vendor} />;
}
