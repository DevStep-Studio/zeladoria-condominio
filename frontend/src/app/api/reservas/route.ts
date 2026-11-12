import { NextResponse } from "next/server";
import { requireCondo } from "@/lib/auth";
import { domainRequest } from "@/lib/api/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { session, condoId } = await requireCondo();

    const { amenityRows, blockRows, reservationRows, unit } = await domainRequest<{
      amenityRows: any[];
      blockRows: any[];
      reservationRows: any[];
      unit: { blockName?: string | null; number: string } | null;
    }>("/painel/reservas", { query: { condoId, role: session.role } });

    return NextResponse.json({
      reservations: reservationRows ?? [],
      amenities: amenityRows ?? [],
      blocks: blockRows ?? [],
      unit: unit ?? null,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao consultar reservas" },
      { status: 500 }
    );
  }
}

