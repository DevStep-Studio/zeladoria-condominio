import { and, desc, eq, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { occurrences, occurrenceComments, blocks, units, users, memberships } from "@/db/schema";
import { requireCondo } from "@/lib/auth";
import { OcorrenciasClient } from "./ocorrencias-client";

export const dynamic = "force-dynamic";

export default async function OcorrenciasPage() {
  const { session, condoId } = await requireCondo();
  const isResident = session.role === "morador";

  const assignedUsers = alias(users, "assigned_users");

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
      assignedToId: occurrences.assignedToId,
      assignedToName: assignedUsers.name,
    })
    .from(occurrences)
    .leftJoin(units, eq(units.id, occurrences.unitId))
    .leftJoin(blocks, eq(blocks.id, units.blockId))
    .leftJoin(users, eq(users.id, occurrences.reportedById))
    .leftJoin(assignedUsers, eq(assignedUsers.id, occurrences.assignedToId))
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

  // Load staff members for assignment (sindico, zelador, etc.)
  let staffMembers: { id: number; name: string; role: string }[] = [];
  try {
    staffMembers = await db
      .select({
        id: users.id,
        name: users.name,
        role: memberships.role,
      })
      .from(memberships)
      .innerJoin(users, eq(users.id, memberships.userId))
      .where(
        and(
          eq(memberships.condoId, condoId),
          inArray(memberships.role, ["sindico", "superadmin", "zelador", "porteiro", "conselho"])
        )
      );
  } catch {
    staffMembers = [];
  }

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
