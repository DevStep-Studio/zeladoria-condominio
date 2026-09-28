import { db } from "@/db";
import { vendors } from "@/db/schema";
import { requireProvider } from "@/lib/auth";
import { ProviderServicosEditorClient } from "./servicos-editor-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Meus Serviços & Catálogo · Zeladoria Prestadores",
  description: "Gerencie seu catálogo de serviços e faixas de preço para os condomínios.",
};

export default async function PrestadorServicosPage() {
  const { session, vendor } = await requireProvider();

  let targetVendor = vendor;
  if (!targetVendor && session.role === "superadmin") {
    const [first] = await db.select().from(vendors).limit(1);
    targetVendor = first;
  }

  if (!targetVendor) {
    return <div>Prestador não encontrado.</div>;
  }

  return <ProviderServicosEditorClient vendor={targetVendor} />;
}
