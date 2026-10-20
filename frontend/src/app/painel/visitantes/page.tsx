import { domainRequest } from "@/lib/api/server";
import { requireCondo } from "@/lib/auth";
import { GATE } from "@/lib/rbac";
import { peopleOptions, unitOptions } from "@/lib/queries";
import { qrDataUrl } from "@/lib/qr";
import { VisitantesClient, type VisitItem, type VisitorItem } from "./visitantes-client";

export const dynamic = "force-dynamic";

export default async function VisitantesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { session, condoId } = await requireCondo();
  const { status } = await searchParams;
  const isResident = session.role === "morador";
  const isGate = GATE.includes(session.role);

  // Consulta todas as visitas do escopo para termos filtragem instantânea no cliente
  const { rows, recurring, allVisitsInScope } = await domainRequest<{
    rows: VisitItem[];
    recurring: VisitorItem[];
    allVisitsInScope: { id: number; status: string }[];
  }>("/painel/visitantes", {
    query: { condoId, role: session.role, status: "todos" },
  });

  const unitList = await unitOptions(condoId);
  const hosts = await peopleOptions(condoId, ["morador", "conselho", "sindico"]);

  // Pré-gera os QR codes dos primeiros convites ativos para renderização ultrarrápida
  const initialQrMap: Record<number, string> = {};
  const activeVisits = (rows ?? []).filter((r) => ["autorizado", "dentro", "aguardando"].includes(r.status)).slice(0, 20);
  for (const visit of activeVisits) {
    if (visit.qrToken) {
      try {
        initialQrMap[visit.id] = await qrDataUrl(visit.qrToken, 200);
      } catch {
        // Fallback silently if generation fails on server
      }
    }
  }

  return (
    <VisitantesClient
      initialRows={rows ?? []}
      allVisitsInScope={allVisitsInScope ?? []}
      recurring={recurring ?? []}
      initialStatus={status || "todos"}
      unitList={unitList ?? []}
      hosts={hosts ?? []}
      isGate={isGate}
      isResident={isResident}
      userRole={session.role}
      currentUserId={session.user.id}
      currentUnitId={session.unitId ?? null}
      initialQrMap={initialQrMap}
    />
  );
}
