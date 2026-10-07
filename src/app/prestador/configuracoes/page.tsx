import { eq } from "drizzle-orm";
import { db } from "@/db";
import { vendors } from "@/db/schema";
import { requireProvider } from "@/lib/auth";
import { ConfiguracoesClient } from "./configuracoes-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Configurações da Conta · Zeladoria Prestadores",
  description: "Ajuste dados de acesso, preferências de notificações e tipo de conta.",
};

export default async function PrestadorConfiguracoesPage() {
  const { session, vendor } = await requireProvider();

  let targetVendor = vendor;
  if (!targetVendor && session.role === "superadmin") {
    const [first] = await db.select().from(vendors).limit(1);
    targetVendor = first;
  }

  if (!targetVendor) {
    return <div>Prestador não encontrado.</div>;
  }

  return <ConfiguracoesClient vendor={targetVendor} user={session.user} />;
}
