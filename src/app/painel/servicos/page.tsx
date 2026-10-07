import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  blocks,
  condominiums,
  customerFavorites,
  serviceMessages,
  serviceQuotes,
  serviceRequests,
  serviceReviews,
  ticketComments,
  tickets,
  units,
  users,
  vendors,
} from "@/db/schema";
import { requireCondo } from "@/lib/auth";
import { getMarketplaceProviders } from "@/lib/services/providers-query";
import { ServicosClient } from "./servicos-client";

export const dynamic = "force-dynamic";

export default async function ServicosPage() {
  const { session, condoId } = await requireCondo();
  const isResident = session.role === "morador";

  // 1. Marketplace Requests (Nova Arquitetura On-Demand & Orçamentos)
  const mpScope = isResident ? eq(serviceRequests.customerId, session.user.id) : undefined;

  let mpRequests: any[] = [];
  try {
    mpRequests = await db
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
        vendorId: serviceRequests.vendorId,
        finalAmountCents: serviceRequests.finalAmountCents,
        estimatedAmountCents: serviceRequests.estimatedAmountCents,
        createdAt: serviceRequests.createdAt,
        completedAt: serviceRequests.completedAt,
        vendorName: vendors.name,
        vendorCompany: vendors.companyName,
        vendorPhoto: vendors.photoUrl,
        vendorPhone: vendors.phone,
      })
      .from(serviceRequests)
      .leftJoin(vendors, eq(vendors.id, serviceRequests.vendorId))
      .where(and(eq(serviceRequests.condoId, condoId), mpScope))
      .orderBy(desc(serviceRequests.createdAt));
  } catch (err) {
    console.warn("Could not query service_requests:", err);
  }

  // 2. Propostas e Orçamentos recebidos
  const requestIds = mpRequests.map((r) => r.id);
  let quotesList: any[] = [];
  if (requestIds.length > 0) {
    try {
      quotesList = await db
        .select({
          id: serviceQuotes.id,
          requestId: serviceQuotes.requestId,
          vendorId: serviceQuotes.vendorId,
          laborCents: serviceQuotes.laborCents,
          materialsCents: serviceQuotes.materialsCents,
          totalCents: serviceQuotes.totalCents,
          description: serviceQuotes.description,
          estimatedDays: serviceQuotes.estimatedDays,
          status: serviceQuotes.status,
          vendorName: vendors.name,
          vendorPhoto: vendors.photoUrl,
          vendorRating: vendors.rating,
        })
        .from(serviceQuotes)
        .leftJoin(vendors, eq(vendors.id, serviceQuotes.vendorId))
        .where(inArray(serviceQuotes.requestId, requestIds));
    } catch (err) {
      console.warn("Could not query service_quotes:", err);
    }
  }

  // 3. Avaliações oficiais já submetidas
  let reviewsList: any[] = [];
  if (requestIds.length > 0) {
    try {
      reviewsList = await db
        .select()
        .from(serviceReviews)
        .where(inArray(serviceReviews.requestId, requestIds));
    } catch (err) {
      console.warn("Could not query service_reviews:", err);
    }
  }

  // 4. Mensagens recentes de chat
  let messagesList: any[] = [];
  if (requestIds.length > 0) {
    try {
      messagesList = await db
        .select({
          id: serviceMessages.id,
          requestId: serviceMessages.requestId,
          senderId: serviceMessages.senderId,
          senderRole: serviceMessages.senderRole,
          body: serviceMessages.body,
          createdAt: serviceMessages.createdAt,
        })
        .from(serviceMessages)
        .where(inArray(serviceMessages.requestId, requestIds))
        .orderBy(desc(serviceMessages.createdAt));
    } catch (err) {
      console.warn("Could not query service_messages:", err);
    }
  }

  // 5. Chamados internos do condomínio (tabela tickets para manutenção predial interna)
  const ticketScope = isResident ? eq(tickets.openedById, session.user.id) : undefined;
  const serviceRows = await db
    .select({
      id: tickets.id,
      code: tickets.code,
      title: tickets.title,
      description: tickets.description,
      category: tickets.category,
      priority: tickets.priority,
      status: tickets.status,
      location: tickets.location,
      preferredTime: tickets.preferredTime,
      vendorId: tickets.vendorId,
      assignedToId: tickets.assignedToId,
      scheduledFor: tickets.scheduledFor,
      costCents: tickets.costCents,
      report: tickets.report,
      rating: tickets.rating,
      ratingComment: tickets.ratingComment,
      createdAt: tickets.createdAt,
      closedAt: tickets.closedAt,
      openedById: tickets.openedById,
      unitNumber: units.number,
      blockName: blocks.name,
      requesterName: users.name,
    })
    .from(tickets)
    .leftJoin(units, eq(units.id, tickets.unitId))
    .leftJoin(blocks, eq(blocks.id, units.blockId))
    .leftJoin(users, eq(users.id, tickets.openedById))
    .where(and(eq(tickets.condoId, condoId), ticketScope))
    .orderBy(desc(tickets.createdAt));

  // 6. Lista de Prestadores e Favoritos
  // 6. Dados do Condomínio para Localização e Proximidade
  const [condoRow] = await db
    .select({
      id: condominiums.id,
      name: condominiums.name,
      address: condominiums.address,
      city: condominiums.city,
      state: condominiums.state,
      latitude: condominiums.latitude,
      longitude: condominiums.longitude,
    })
    .from(condominiums)
    .where(eq(condominiums.id, condoId))
    .limit(1);

  const condoInfo = {
    id: condoId,
    name: condoRow?.name || session.condo?.name || "Residencial Parque das Águas",
    address: condoRow?.address || "Av. das Nações, 1200",
    city: condoRow?.city || "Curitiba",
    state: condoRow?.state || "PR",
    latitude: condoRow?.latitude ?? null,
    longitude: condoRow?.longitude ?? null,
  };

  // 7. Lista de Prestadores e Favoritos
  let vendorList: any[] = [];
  try {
    vendorList = await db
      .select()
      .from(vendors)
      .where(and(eq(vendors.condoId, condoId), eq(vendors.active, true)));
  } catch (err) {
    console.warn("Could not query vendors:", err);
  }

  const providers = await getMarketplaceProviders(condoId, {
    currentUserId: session.user.id,
    condoLat: condoInfo.latitude,
    condoLng: condoInfo.longitude,
  });

  let userFavoriteIds: number[] = [];
  try {
    const favoriteRows = await db
      .select({ vendorId: customerFavorites.vendorId })
      .from(customerFavorites)
      .where(eq(customerFavorites.customerId, session.user.id));
    userFavoriteIds = favoriteRows.map((f) => f.vendorId);
  } catch (err) {
    console.warn("Could not query customerFavorites:", err);
  }

  return (
    <ServicosClient
      services={serviceRows}
      marketplaceRequests={mpRequests}
      quotes={quotesList}
      reviews={reviewsList}
      messages={messagesList}
      initialFavorites={userFavoriteIds}
      vendors={vendorList}
      providers={providers}
      condoInfo={condoInfo}
      canSwitchCondo={session.memberships.length > 1 || session.user.isSuperAdmin}
      role={session.role}
      currentUserId={session.user.id}
    />
  );
}
