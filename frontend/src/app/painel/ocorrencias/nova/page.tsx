import { domainRequest } from "@/lib/api/server";

import { requireCondo } from "@/lib/auth";
import { NovaOcorrenciaFlow } from "./nova-ocorrencia-flow";

export const dynamic = "force-dynamic";

export default async function NovaOcorrenciaPage() {
  const { session, condoId } = await requireCondo();

  const { unitRow, condoBlocks, condoAmenities } = await domainRequest<{
    unitRow: { unitId: number; unitNumber: string; blockName: string | null } | null;
    condoBlocks: any[];
    condoAmenities: any[];
  }>("/painel/ocorrencias/nova", { query: { condoId, role: session.role } });

  const userUnit = unitRow
    ? {
        unitId: unitRow.unitId,
        unitNumber: unitRow.unitNumber,
        blockName: unitRow.blockName,
        condoName: session.condo?.name || "Condomínio",
      }
    : null;

  return (
    <NovaOcorrenciaFlow
      userUnit={userUnit}
      condoName={session.condo?.name || "Condomínio"}
      blocks={condoBlocks}
      amenities={condoAmenities}
      userName={session.user.name}
    />
  );
}
