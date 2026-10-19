import { domainRequest } from "@/lib/api/server";

import { requireCondo } from "@/lib/auth";
import { unitOptions } from "@/lib/queries";
import { PortariaClient } from "./portaria-client";

export const dynamic = "force-dynamic";

export default async function PortariaPage() {
  const { session, condoId } = await requireCondo();

  const { visitRows, parcelRows } = await domainRequest<{
    visitRows: any[];
    parcelRows: any[];
  }>("/painel/portaria", { query: { condoId, role: session.role } });

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
