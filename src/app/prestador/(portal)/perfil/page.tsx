import { domainRequest, type ProviderDashboard } from "@/lib/api/domain";
import type { DomainModels } from "@/lib/api/models";

import { requireProvider } from "@/lib/auth";
import { ProviderPerfilEditorClient } from "./perfil-editor-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Meu Perfil & Loja · Zeladoria Prestadores",
  description: "Gerencie a apresentação pública, portfólio e fotos da sua loja no marketplace.",
};

export default async function PrestadorPerfilPage() {
  const { session } = await requireProvider();
  const vendor = await domainRequest<DomainModels["vendors"]>("/prestador/perfil");
  return <ProviderPerfilEditorClient vendor={vendor} />;
}
