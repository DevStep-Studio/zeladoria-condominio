import { domainRequest } from "@/lib/api/domain";
import type { DomainModels } from "@/lib/api/models";
import { requireProvider } from "@/lib/auth";
import { ProviderDocumentosClient } from "./documentos-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Documentos & Verificação · Zeladoria Prestadores",
  description: "Gerencie sua documentação profissional e acompanhe o status de credenciamento.",
};

export default async function PrestadorDocumentosPage() {
  await requireProvider();
  const vendor = await domainRequest<DomainModels["vendors"]>("/prestador/perfil");
  return <ProviderDocumentosClient vendor={vendor} />;
}
