import { NextResponse } from "next/server";
import { requireCondo } from "@/lib/auth";
import { domainRequest } from "@/lib/api/server";
import { qrDataUrl } from "@/lib/qr";
import type { ParcelItem } from "@/app/painel/encomendas/encomendas-client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { session, condoId } = await requireCondo();
    const activeMembership = session.memberships.find((m) => m.condoId === condoId);
    const residentUnitId = activeMembership?.unitId ?? session.unitId;

    const { rows } = await domainRequest<{
      rows: ParcelItem[];
      stale: { id: number };
    }>("/painel/encomendas", {
      query: {
        condoId,
        role: session.role,
        residentUnitId: residentUnitId ?? undefined,
        unitId: residentUnitId ?? undefined,
      },
    });

    const parcelRows = rows ?? [];
    const qrMap: Record<number, string> = {};

    for (const parcel of parcelRows) {
      if (parcel.pickupCode) {
        try {
          qrMap[parcel.id] = await qrDataUrl(`ENC:${parcel.code}:${parcel.pickupCode}`, 160);
        } catch {
          // Fallback gracioso
        }
      }
    }

    return NextResponse.json({
      rows: parcelRows,
      qrMap,
      count: parcelRows.length,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao consultar encomendas" },
      { status: 500 }
    );
  }
}

