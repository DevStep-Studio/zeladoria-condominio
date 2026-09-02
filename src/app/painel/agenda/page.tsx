import { and, asc, desc, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { agendaEvents, amenities, assemblies, reservations } from "@/db/schema";
import { requireCondo } from "@/lib/auth";
import { AgendaClient } from "./agenda-client";

export const dynamic = "force-dynamic";

export default async function AgendaPage() {
  const { session, condoId } = await requireCondo();

  // Load all agenda events for this condo
  const events = await db
    .select()
    .from(agendaEvents)
    .where(eq(agendaEvents.condoId, condoId))
    .orderBy(asc(agendaEvents.date), asc(agendaEvents.startTime));

  // Load amenities for area conflict selection
  const amenityList = await db
    .select()
    .from(amenities)
    .where(and(eq(amenities.condoId, condoId), eq(amenities.active, true)));

  // Load approved reservations to display alongside
  const approvedReservations = await db
    .select({
      id: reservations.id,
      date: reservations.date,
      startTime: reservations.startTime,
      endTime: reservations.endTime,
      guests: reservations.guests,
      amenityName: amenities.name,
    })
    .from(reservations)
    .leftJoin(amenities, eq(amenities.id, reservations.amenityId))
    .where(and(eq(reservations.condoId, condoId), eq(reservations.status, "aprovada")));

  const isStaff = ["superadmin", "sindico", "conselho", "zelador"].includes(session.role);

  return (
    <AgendaClient
      events={events}
      amenities={amenityList}
      reservations={approvedReservations}
      isStaff={isStaff}
      role={session.role}
      userId={session.user.id}
    />
  );
}
