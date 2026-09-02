import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { blocks, parcels, units, users, visitors, visits } from "@/db/schema";
import { requireCondo } from "@/lib/auth";
import { unitOptions } from "@/lib/queries";
import { PortariaClient } from "./portaria-client";

export const dynamic = "force-dynamic";

export default async function PortariaPage() {
  const { session, condoId } = await requireCondo();
  const isResident = session.role === "morador";

  // If morador, scope visits to ones hosted by them; staff sees all
  const visitScope = isResident ? eq(visits.hostUserId, session.user.id) : undefined;
  const parcelScope = isResident && session.unitId ? eq(parcels.unitId, session.unitId) : undefined;

  const visitRows = await db
    .select({
      id: visits.id,
      status: visits.status,
      purpose: visits.purpose,
      checkinAt: visits.checkinAt,
      checkoutAt: visits.checkoutAt,
      validUntil: visits.validUntil,
      qrToken: visits.qrToken,
      plate: visits.vehiclePlate,
      name: visitors.name,
      document: visitors.document,
      kind: visitors.kind,
      company: visitors.company,
      unit: units.number,
      block: blocks.name,
      host: users.name,
      hostUserId: visits.hostUserId,
    })
    .from(visits)
    .innerJoin(visitors, eq(visitors.id, visits.visitorId))
    .leftJoin(units, eq(units.id, visits.unitId))
    .leftJoin(blocks, eq(blocks.id, units.blockId))
    .leftJoin(users, eq(users.id, visits.hostUserId))
    .where(and(eq(visits.condoId, condoId), visitScope))
    .orderBy(desc(visits.createdAt));

  const parcelRows = await db
    .select({
      id: parcels.id,
      code: parcels.code,
      carrier: parcels.carrier,
      receivedAt: parcels.receivedAt,
      deliveredAt: parcels.pickedUpAt,
      status: parcels.status,
      pickupCode: parcels.pickupCode,
      unit: units.number,
      block: blocks.name,
      recipientName: parcels.pickedUpBy,
    })
    .from(parcels)
    .leftJoin(units, eq(units.id, parcels.unitId))
    .leftJoin(blocks, eq(blocks.id, units.blockId))
    .where(and(eq(parcels.condoId, condoId), parcelScope))
    .orderBy(desc(parcels.receivedAt));

  const unitList = await unitOptions(condoId);

  return (
    <PortariaClient
      visits={visitRows}
      parcels={parcelRows}
      units={unitList}
      role={session.role}
      currentUserId={session.user.id}
    />
  );
}
