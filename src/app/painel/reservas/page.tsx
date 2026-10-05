import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { amenities, amenityBlocks, blocks, reservations, units, users } from "@/db/schema";
import { requireCondo } from "@/lib/auth";
import { ensureSeed } from "@/db/seed";
import { ALL_STAFF } from "@/lib/rbac";
import { ReservasClient } from "./reservas-client";

export const dynamic = "force-dynamic";

export default async function ReservasPage() {
  await ensureSeed();
  const { session, condoId } = await requireCondo();

  const isStaff = ALL_STAFF.includes(session.role);

  // Load amenities for this condo (all for staff, active only for morador)
  const amenityRows = isStaff
    ? await db
        .select()
        .from(amenities)
        .where(eq(amenities.condoId, condoId))
        .orderBy(asc(amenities.name))
    : await db
        .select()
        .from(amenities)
        .where(and(eq(amenities.condoId, condoId), eq(amenities.active, true)))
        .orderBy(asc(amenities.name));

  // Load blocks
  const blockRows = await db
    .select()
    .from(amenityBlocks)
    .where(eq(amenityBlocks.condoId, condoId))
    .orderBy(desc(amenityBlocks.startDate));

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
      guestList: reservations.guestList,
      totalCents: reservations.totalCents,
      depositCents: reservations.depositCents,
      paymentStatus: reservations.paymentStatus,
      status: reservations.status,
      rejectionReason: reservations.rejectionReason,
      cancellationReason: reservations.cancellationReason,
      cancelledAt: reservations.cancelledAt,
      approvedAt: reservations.approvedAt,
      rulesAccepted: reservations.rulesAccepted,
      notes: reservations.notes,
      qrToken: reservations.qrToken,
      unitNumber: units.number,
      blockName: blocks.name,
      userName: users.name,
      userId: reservations.userId,
      createdAt: reservations.createdAt,
    })
    .from(reservations)
    .innerJoin(amenities, eq(amenities.id, reservations.amenityId))
    .leftJoin(units, eq(units.id, reservations.unitId))
    .leftJoin(blocks, eq(blocks.id, units.blockId))
    .leftJoin(users, eq(users.id, reservations.userId))
    .where(eq(reservations.condoId, condoId))
    .orderBy(desc(reservations.date), desc(reservations.startTime));

  // Find user's active unit label
  let userUnitLabel: string | null = null;
  if (session.unitId) {
    const [u] = await db
      .select({ number: units.number, blockName: blocks.name })
      .from(units)
      .leftJoin(blocks, eq(blocks.id, units.blockId))
      .where(eq(units.id, session.unitId))
      .limit(1);
    if (u) {
      userUnitLabel = u.blockName ? `${u.blockName} · Apto ${u.number}` : `Apto ${u.number}`;
    }
  }

  return (
    <ReservasClient
      amenities={amenityRows}
      reservations={reservationRows}
      blocks={blockRows}
      role={session.role}
      currentUser={{
        id: session.user.id,
        name: session.user.name,
        unitId: session.unitId,
        unitLabel: userUnitLabel,
      }}
    />
  );
}
