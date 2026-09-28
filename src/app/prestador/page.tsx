import { and, desc, eq, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  serviceQuotes,
  serviceRequests,
  serviceReviews,
  users,
  vendors,
} from "@/db/schema";
import { requireProvider } from "@/lib/auth";
import { ProviderDashboardClient } from "./dashboard-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Painel do Prestador · Zeladoria Serviços",
  description: "Visão geral das solicitações, chamados e agenda de hoje.",
};

export default async function PrestadorDashboardPage() {
  const { session, vendor } = await requireProvider();

  // Se superadmin sem vendor, pega o primeiro vendor ativo
  let targetVendor = vendor;
  if (!targetVendor && session.role === "superadmin") {
    const [first] = await db.select().from(vendors).limit(1);
    targetVendor = first;
  }

  if (!targetVendor) {
    return <div>Prestador não encontrado.</div>;
  }

  // Chamados direcionados a ele ou buscando prestadores da mesma categoria e condomínio
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
      status: serviceRequests.status,
      estimatedAmountCents: serviceRequests.estimatedAmountCents,
      finalAmountCents: serviceRequests.finalAmountCents,
      createdAt: serviceRequests.createdAt,
      customerName: users.name,
      customerPhone: users.phone,
    })
    .from(serviceRequests)
    .innerJoin(users, eq(users.id, serviceRequests.customerId))
    .where(
      and(
        eq(serviceRequests.condoId, targetVendor.condoId),
        or(
          eq(serviceRequests.vendorId, targetVendor.id),
          and(
            eq(serviceRequests.category, targetVendor.category),
            eq(serviceRequests.status, "buscando_prestador")
          )
        )
      )
    )
    .orderBy(desc(serviceRequests.createdAt))
    .limit(20);

  // Propostas de orçamento enviadas por ele
  const quotes = await db
    .select()
    .from(serviceQuotes)
    .where(eq(serviceQuotes.vendorId, targetVendor.id))
    .orderBy(desc(serviceQuotes.createdAt))
    .limit(10);

  // Avaliações recebidas
  const reviews = await db
    .select({
      id: serviceReviews.id,
      rating: serviceReviews.rating,
      comment: serviceReviews.comment,
      createdAt: serviceReviews.createdAt,
      authorName: users.name,
    })
    .from(serviceReviews)
    .innerJoin(users, eq(users.id, serviceReviews.customerId))
    .where(eq(serviceReviews.vendorId, targetVendor.id))
    .orderBy(desc(serviceReviews.createdAt))
    .limit(5);

  return (
    <ProviderDashboardClient
      vendor={targetVendor}
      requests={requests}
      quotes={quotes}
      reviews={reviews}
    />
  );
}
