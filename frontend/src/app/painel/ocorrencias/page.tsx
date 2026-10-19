import { domainRequest } from "@/lib/api/server";

import { requireCondo } from "@/lib/auth";
import { OcorrenciasClient } from "./ocorrencias-client";

export const dynamic = "force-dynamic";

export default async function OcorrenciasPage() {
  const { session, condoId } = await requireCondo();
  const isResident = session.role === "morador";

  const { occurrenceRows, comments, staffMembers } = await domainRequest<{
    occurrenceRows: any[];
    comments: any[];
    staffMembers: { id: number; name: string; role: string }[];
  }>("/painel/ocorrencias", { query: { condoId, role: session.role } });

  // If resident, filter out confidential occurrences from other users
  const visibleOccurrences = occurrenceRows.filter((o) => {
    if (!isResident) return true;
    if (o.reportedById === session.user.id) return true;
    return o.visibility === "publica";
  });

  return (
    <OcorrenciasClient
      occurrences={visibleOccurrences}
      comments={comments}
      staffMembers={staffMembers}
      role={session.role}
      currentUserId={session.user.id}
      currentUserName={session.user.name}
    />
  );
}
