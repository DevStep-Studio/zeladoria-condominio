import { requirePermission } from "@/lib/auth";
import { queryIncidents } from "@/lib/services/system-incidents-storage";
import { CentralAvisosErrosClient } from "./central-client";

export const dynamic = "force-dynamic";

export default async function AvisosErrosPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: "visao-geral" | "operacionais" | "tecnicos" | "historico";
    q?: string;
    priority?: "P0" | "P1" | "P2" | "P3";
    status?: string;
    module?: string;
    assignee?: string;
    startDate?: string;
    endDate?: string;
    page?: string;
  }>;
}) {
  const { session, condoId } = await requirePermission("system.incidents.view");
  const params = await searchParams;

  const isSuperAdmin = session.role === "superadmin" || session.user.isSuperAdmin;

  const initialData = queryIncidents({
    tab: params.tab || "visao-geral",
    q: params.q || "",
    priority: params.priority,
    status: params.status,
    module: params.module,
    assignee: params.assignee,
    startDate: params.startDate,
    endDate: params.endDate,
    page: parseInt(params.page || "1", 10),
    perPage: 15,
    condoId,
    isSuperAdmin,
  });

  return (
    <CentralAvisosErrosClient
      initialData={initialData}
      condoId={condoId}
      isSuperAdmin={isSuperAdmin}
      currentRole={session.role}
      currentUser={{ id: session.user.id, name: session.user.name }}
      condoName={session.condo?.name ?? null}
    />
  );
}
