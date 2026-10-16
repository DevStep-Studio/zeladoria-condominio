import { and, desc, eq, inArray, or } from "drizzle-orm";
import { db } from "@/db";
import { condominiums, serviceQuotes, serviceRequests, users, vendors } from "@/db/schema";
import { requireProvider } from "@/lib/auth";
import { ProviderChamadosClient } from "./chamados-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Meus Chamados · Zeladoria Prestadores",
  description: "Gerencie seus atendimentos, orçamentos e histórico de serviços.",
};

export default async function PrestadorChamadosPage() {
  const { session, vendor } = await requireProvider();

  let targetVendor = vendor;
  if (!targetVendor && session.role === "superadmin") {
    const [first] = await db.select().from(vendors).limit(1);
    targetVendor = first;
  }

  if (!targetVendor) {
    return <div>Prestador não encontrado.</div>;
  }

  const requests = await db
    .select({
      id: serviceRequests.id,
      code: serviceRequests.code,
      mode: serviceRequests.mode,
      category: serviceRequests.category,
      title: serviceRequests.title,
      description: serviceRequests.description,
      urgency: serviceRequests.urgency,
      scheduledDate: serviceRequests.scheduledDate,
      scheduledTimeSlot: serviceRequests.scheduledTimeSlot,
      location: serviceRequests.location,
      attachments: serviceRequests.attachments,
      status: serviceRequests.status,
      vendorId: serviceRequests.vendorId,
      estimatedAmountCents: serviceRequests.estimatedAmountCents,
      finalAmountCents: serviceRequests.finalAmountCents,
      createdAt: serviceRequests.createdAt,
      acceptedAt: serviceRequests.acceptedAt,
      completedAt: serviceRequests.completedAt,
      customerName: users.name,
      customerPhone: users.phone,
      condoName: condominiums.name,
    })
    .from(serviceRequests)
    .innerJoin(users, eq(users.id, serviceRequests.customerId))
    .leftJoin(condominiums, eq(condominiums.id, serviceRequests.condoId))
    .where(
      and(
        eq(serviceRequests.condoId, targetVendor.condoId),
        or(
          eq(serviceRequests.vendorId, targetVendor.id),
          and(
            eq(serviceRequests.category, targetVendor.category),
            inArray(serviceRequests.status, [
              "solicitado",
              "buscando_prestador",
              "proposta_enviada",
              "aguardando_orcamentos",
            ])
          )
        )
      )
    )
    .orderBy(desc(serviceRequests.createdAt));

  const vendorQuotes = await db
    .select()
    .from(serviceQuotes)
    .where(eq(serviceQuotes.vendorId, targetVendor.id))
    .orderBy(desc(serviceQuotes.createdAt));

  return (
    <ProviderChamadosClient
      vendor={targetVendor}
      requests={requests}
      quotes={vendorQuotes}
    />
  );
}
