import { domainRequest } from "@/lib/api/server";
import { requireCondo } from "@/lib/auth";
import { GATE } from "@/lib/rbac";
import { unitOptions } from "@/lib/queries";
import { qrDataUrl } from "@/lib/qr";
import { EncomendasClient, type ParcelItem } from "./encomendas-client";

export const dynamic = "force-dynamic";

export default async function EncomendasPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { session, condoId } = await requireCondo();
  const { status } = await searchParams;
  const currentStatus = status ?? "todas";
  const isGate = GATE.includes(session.role);
  const isResident = session.role === "morador";

  const { rows } = await domainRequest<{
    rows: ParcelItem[];
    stale: { id: number };
  }>("/painel/encomendas", { query: { condoId, role: session.role } });

  const parcelRows = rows ?? [];
  const unitList = isGate ? await unitOptions(condoId) : [];

  // Gera previamente os QR Codes de todas as encomendas no escopo permitido
  const qrMap: Record<number, string> = {};
  for (const parcel of parcelRows) {
    if (parcel.pickupCode) {
      try {
        qrMap[parcel.id] = await qrDataUrl(`ENC:${parcel.code}:${parcel.pickupCode}`, 160);
      } catch {
        // Fallback gracioso caso falhe geração de data url individual
      }
    }
  }

  return (
    <EncomendasClient
      initialRows={parcelRows}
      initialStatus={currentStatus}
      unitList={unitList}
      isGate={isGate}
      isResident={isResident}
      initialQrMap={qrMap}
    />
  );
}
