import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { occurrences, occurrenceComments, blocks, units, users } from "@/db/schema";
import { requireCondo } from "@/lib/auth";
import { OcorrenciasClient } from "./ocorrencias-client";

export const dynamic = "force-dynamic";

export default async function OcorrenciasPage() {
  const { session, condoId } = await requireCondo();
  const isResident = session.role === "morador";

  // If morador, only see their own occurrences OR public ones (confidential ones from others are hidden)
  const occurrenceScope = isResident
    ? undefined // Filtered in query/logic based on reportedById or visibility === 'publica'
    : undefined;

  const occurrenceRows = await db
    .select({
      id: occurrences.id,
      code: occurrences.code,
      title: occurrences.title,
      description: occurrences.description,
      category: occurrences.category,
      severity: occurrences.severity,
      visibility: occurrences.visibility,
      status: occurrences.status,
      exactLocation: occurrences.exactLocation,
      actionsTaken: occurrences.actionsTaken,
      attachments: occurrences.attachments,
      residentRating: occurrences.residentRating,
      residentComment: occurrences.residentComment,
      createdAt: occurrences.createdAt,
      occurredAt: occurrences.occurredAt,
      resolvedAt: occurrences.resolvedAt,
      reportedById: occurrences.reportedById,
      reporterName: users.name,
      unitNumber: units.number,
      blockName: blocks.name,
    })
    .from(occurrences)
    .leftJoin(units, eq(units.id, occurrences.unitId))
    .leftJoin(blocks, eq(blocks.id, units.blockId))
    .leftJoin(users, eq(users.id, occurrences.reportedById))
    .where(eq(occurrences.condoId, condoId))
    .orderBy(desc(occurrences.createdAt));

  // If resident, filter out confidential occurrences from other users
  const visibleOccurrences = occurrenceRows.filter((o) => {
    if (!isResident) return true;
    if (o.reportedById === session.user.id) return true;
    return o.visibility === "publica";
  });

  // Load comments
  const comments = await db
    .select({
      id: occurrenceComments.id,
      occurrenceId: occurrenceComments.occurrenceId,
      body: occurrenceComments.body,
      createdAt: occurrenceComments.createdAt,
      userName: users.name,
      userId: users.id,
    })
    .from(occurrenceComments)
    .leftJoin(users, eq(users.id, occurrenceComments.userId))
    .orderBy(occurrenceComments.createdAt);

  return (
    <OcorrenciasClient
      occurrences={visibleOccurrences}
      comments={comments}
      role={session.role}
      currentUserId={session.user.id}
    />
  );
}
