import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { amenities, blocks, reservations, units, users } from "@/db/schema";
import { requireCondo } from "@/lib/auth";
import { ReservasClient } from "./reservas-client";

export const dynamic = "force-dynamic";

export default async function ReservasPage() {
  const { session, condoId } = await requireCondo();

  // Load amenities for this condo
  const amenityRows = await db
    .select()
    .from(amenities)
    .where(and(eq(amenities.condoId, condoId), eq(amenities.active, true)))
    .orderBy(asc(amenities.name));

  // Load reservations
  const reservationRows = await db
    .select({
      id: reservations.id,
      amenityId: reservations.amenityId,
      amenityName: amenities.name,
      date: reservations.date,
      startTime: reservations.startTime,
      endTime: reservations.endTime,
      guests: reservations.guests,
      status: reservations.status,
      rejectionReason: reservations.rejectionReason,
      notes: reservations.notes,
      qrToken: reservations.qrToken,
      unitNumber: units.number,
      blockName: blocks.name,
      userName: users.name,
      userId: reservations.userId,
    })
    .from(reservations)
    .innerJoin(amenities, eq(amenities.id, reservations.amenityId))
    .leftJoin(units, eq(units.id, reservations.unitId))
    .leftJoin(blocks, eq(blocks.id, units.blockId))
    .leftJoin(users, eq(users.id, reservations.userId))
    .where(eq(reservations.condoId, condoId))
    .orderBy(desc(reservations.date), desc(reservations.startTime));

  return (
    <ReservasClient
      amenities={amenityRows}
      reservations={reservationRows}
      role={session.role}
      currentUserId={session.user.id}
    />
  );
}
