import { domainRequest } from "@/lib/api/server";

import { requireCondo } from "@/lib/auth";
import { AgendaClient } from "./agenda-client";

export const dynamic = "force-dynamic";

export default async function AgendaPage() {
  const { session, condoId } = await requireCondo();

  const { events, amenityList, approvedReservations } = await domainRequest<{
    events: any[];
    amenityList: any[];
    approvedReservations: any[];
  }>("/painel/agenda", { query: { condoId, role: session.role } });

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
