import { db } from "@/db";
import { vendors } from "@/db/schema";
import { requireProvider } from "@/lib/auth";
import { ProviderPerfilEditorClient } from "./perfil-editor-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Meu Perfil & Loja · Zeladoria Prestadores",
  description: "Gerencie a apresentação pública, portfólio e fotos da sua loja no marketplace.",
};

export default async function PrestadorPerfilPage() {
  const { session, vendor } = await requireProvider();

  let targetVendor = vendor;
  if (!targetVendor && session.role === "superadmin") {
    const [first] = await db.select().from(vendors).limit(1);
    targetVendor = first;
  }

  if (!targetVendor) {
    return <div>Prestador não encontrado.</div>;
  }

  return <ProviderPerfilEditorClient vendor={targetVendor} />;
}
