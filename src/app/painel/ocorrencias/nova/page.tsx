import { eq } from "drizzle-orm";
import { db } from "@/db";
import { blocks, units, amenities } from "@/db/schema";
import { requireCondo } from "@/lib/auth";
import { NovaOcorrenciaFlow } from "./nova-ocorrencia-flow";

export const dynamic = "force-dynamic";

export default async function NovaOcorrenciaPage() {
  const { session, condoId } = await requireCondo();

  // Buscar dados da unidade do morador se houver
  let userUnit: {
    unitId: number;
    unitNumber: string;
    blockName: string | null;
    condoName: string;
  } | null = null;

  if (session.unitId) {
    const [unitRow] = await db
      .select({
        unitId: units.id,
        unitNumber: units.number,
        blockName: blocks.name,
      })
      .from(units)
      .leftJoin(blocks, eq(blocks.id, units.blockId))
      .where(eq(units.id, session.unitId))
      .limit(1);

    if (unitRow) {
      userUnit = {
        unitId: unitRow.unitId,
        unitNumber: unitRow.unitNumber,
        blockName: unitRow.blockName,
        condoName: session.condo?.name || "Condomínio",
      };
    }
  }

  // Buscar blocos do condomínio para localização hierárquica
  const condoBlocks = await db
    .select({
      id: blocks.id,
      name: blocks.name,
      floors: blocks.floors,
    })
    .from(blocks)
    .where(eq(blocks.condoId, condoId));

  // Buscar áreas comuns cadastradas (amenities)
  const condoAmenities = await db
    .select({
      id: amenities.id,
      name: amenities.name,
    })
    .from(amenities)
    .where(eq(amenities.condoId, condoId));

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
