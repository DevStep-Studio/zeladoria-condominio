import { and, desc, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { tickets, ticketComments, vendors, users, units, blocks } from "@/db/schema";
import { requireCondo } from "@/lib/auth";
import { getMarketplaceProviders } from "@/lib/services/providers-query";
import { ServicosClient } from "./servicos-client";

export const dynamic = "force-dynamic";

export default async function ServicosPage() {
  const { session, condoId } = await requireCondo();
  const isResident = session.role === "morador";

  // Load services for this condo
  const serviceScope = isResident ? eq(tickets.openedById, session.user.id) : undefined;

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
    .where(and(eq(tickets.condoId, condoId), serviceScope))
    .orderBy(desc(tickets.createdAt));

  // Load vendors list
  const vendorList = await db
    .select()
    .from(vendors)
    .where(and(eq(vendors.condoId, condoId), eq(vendors.active, true)));

  // Load all staff for assignment
  const staffUsers = await db
    .select({ id: users.id, name: users.name })
    .from(users);

  const providers = await getMarketplaceProviders(condoId);

  return (
    <ServicosClient
      services={serviceRows}
      vendors={vendorList}
      providers={providers}
      staff={staffUsers}
      role={session.role}
      currentUserId={session.user.id}
    />
  );
}
