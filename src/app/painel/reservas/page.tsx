import { domainRequest } from "@/lib/api/server";

import { requireCondo } from "@/lib/auth";

import { ALL_STAFF } from "@/lib/rbac";
import { ReservasClient } from "./reservas-client";

export const dynamic = "force-dynamic";

export default async function ReservasPage() {
  const { session, condoId } = await requireCondo();

  const { amenityRows, blockRows, reservationRows, unit } = await domainRequest<{
    amenityRows: any[];
    blockRows: any[];
    reservationRows: any[];
    unit: { blockName?: string | null; number: string } | null;
  }>("/painel/reservas", { query: { condoId, role: session.role } });

  const userUnitLabel = unit
    ? unit.blockName
      ? `${unit.blockName} · Apto ${unit.number}`
      : `Apto ${unit.number}`
    : null;

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
