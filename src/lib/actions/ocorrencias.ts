"use server";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { occurrences, occurrenceComments, memberships } from "@/db/schema";
import { requireCondo, requireRole } from "@/lib/auth";
import { logAudit, notify } from "@/lib/audit";
import { ALL_STAFF } from "@/lib/rbac";
import { num, sequence, str } from "@/lib/utils";

export async function createOccurrenceAction(formData: FormData) {
  const { session, condoId } = await requireCondo();
  const title = str(formData, "title");
  const description = str(formData, "description");
  if (!title || !description) {
    return { success: false, error: "Título e descrição são obrigatórios." };
  }

  const category = str(formData, "category", "seguranca");
  const severity = str(formData, "severity", "media");
  const visibility = str(formData, "visibility", "publica");
  const exactLocation = str(formData, "exactLocation");
  const unitId = session.role === "morador" ? session.unitId : num(formData, "unitId") || session.unitId || null;

  // Fotos anexadas (data URLs ou links), enviadas pelo formulário como JSON.
  let attachments: string[] = [];
  const rawAttachments = str(formData, "attachments");
  if (rawAttachments) {
    try {
      const parsed = JSON.parse(rawAttachments);
      if (Array.isArray(parsed)) {
        attachments = parsed
          .filter((v): v is string => typeof v === "string")
          .filter((v) => /^(data:image\/|https?:\/\/)/.test(v))
          .slice(0, 4);
      }
    } catch {
      attachments = [];
    }
  }

  const [countRow] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(occurrences)
    .where(eq(occurrences.condoId, condoId));

  const code = sequence("OC", Number(countRow?.n ?? 0) + 101);

  const rawLat = str(formData, "latitude");
  const rawLng = str(formData, "longitude");
  const parsedLat = rawLat ? parseFloat(rawLat) : null;
  const parsedLng = rawLng ? parseFloat(rawLng) : null;
  const latitude = parsedLat !== null && !isNaN(parsedLat) ? parsedLat : null;
  const longitude = parsedLng !== null && !isNaN(parsedLng) ? parsedLng : null;

  const [occ] = await db
    .insert(occurrences)
    .values({
      condoId,
      code,
      title,
      description,
      category,
      severity,
      visibility,
      exactLocation,
      latitude,
      longitude,
      unitId,
      attachments,
      status: "recebida",
      reportedById: session.user.id,
      occurredAt: new Date(),
    })
    .returning();

  // Notify sindicos
  const sindicos = await db
    .select({ userId: memberships.userId })
    .from(memberships)
    .where(and(eq(memberships.condoId, condoId), eq(memberships.role, "sindico")));

  await notify(
    condoId,
    sindicos.map((s) => s.userId),
    `Nova ocorrência registrada: ${occ.code}`,
    `${title} [${severity.toUpperCase()}] - Registrada por ${session.user.name}`,
    `/painel/ocorrencias`,
  );

  await logAudit({
    session,
    condoId,
    action: "criar",
    entity: "ocorrencia",
    entityId: occ.id,
    summary: `Registrou ocorrência ${occ.code}: ${title} (${visibility})`,
  });

  revalidatePath("/painel/ocorrencias");
  revalidatePath("/painel");
  return { success: true };
}

export async function updateOccurrenceStatusAction(formData: FormData) {
  const { session, condoId } = await requireRole([...ALL_STAFF, "porteiro"]);
  const id = num(formData, "id");
  if (!id) return { success: false, error: "ID inválido." };

  const [existing] = await db
    .select()
    .from(occurrences)
    .where(and(eq(occurrences.id, id), eq(occurrences.condoId, condoId)))
    .limit(1);

  if (!existing) return { success: false, error: "Ocorrência não encontrada." };

  const status = str(formData, "status", existing.status);
  const actionsTaken = str(formData, "actionsTaken") || existing.actionsTaken;
  const assignedToId = num(formData, "assignedToId") || existing.assignedToId;
  const comment = str(formData, "comment");

  const isResolved = status === "resolvida";

  await db
    .update(occurrences)
    .set({
      status,
      actionsTaken,
      assignedToId: assignedToId || null,
      resolvedAt: isResolved ? new Date() : existing.resolvedAt,
      ackById: session.user.id,
      ackAt: new Date(),
    })
    .where(eq(occurrences.id, id));

  if (comment) {
    await db.insert(occurrenceComments).values({
      occurrenceId: id,
      userId: session.user.id,
      body: comment,
      internal: false,
    });
  }

  if (existing.reportedById) {
    await notify(
      condoId,
      [existing.reportedById],
      `Atualização na ocorrência ${existing.code}`,
      `O status foi alterado para: ${status.replace("_", " ").toUpperCase()}`,
      "/painel/ocorrencias",
    );
  }

  await logAudit({
    session,
    condoId,
    action: "atualizar",
    entity: "ocorrencia",
    entityId: id,
    summary: `Atualizou status da ocorrência ${existing.code} para ${status}`,
  });

  revalidatePath("/painel/ocorrencias");
  revalidatePath("/painel");
  return { success: true };
}

export async function addOccurrenceCommentAction(formData: FormData) {
  const { session, condoId } = await requireCondo();
  const occurrenceId = num(formData, "occurrenceId");
  const body = str(formData, "body");

  if (!occurrenceId || !body) return { success: false, error: "Comentário inválido." };

  const [existing] = await db
    .select()
    .from(occurrences)
    .where(and(eq(occurrences.id, occurrenceId), eq(occurrences.condoId, condoId)))
    .limit(1);

  if (!existing) return { success: false, error: "Ocorrência não encontrada." };

  await db.insert(occurrenceComments).values({
    occurrenceId,
    userId: session.user.id,
    body,
    internal: false,
  });

  revalidatePath("/painel/ocorrencias");
  return { success: true };
}

export async function rateOccurrenceAction(formData: FormData) {
  const { session, condoId } = await requireCondo();
  const id = num(formData, "id");
  const rating = num(formData, "rating");
  const comment = str(formData, "residentComment");

  if (!id || !rating) return { success: false, error: "Avaliação inválida." };

  const [existing] = await db
    .select()
    .from(occurrences)
    .where(and(eq(occurrences.id, id), eq(occurrences.condoId, condoId)))
    .limit(1);

  if (!existing) return { success: false, error: "Ocorrência não encontrada." };

  await db
    .update(occurrences)
    .set({
      residentRating: rating,
      residentComment: comment,
    })
    .where(eq(occurrences.id, id));

  await logAudit({
    session,
    condoId,
    action: "avaliar",
    entity: "ocorrencia",
    entityId: id,
    summary: `Avaliou resolução da ocorrência ${existing.code} com nota ${rating}/5`,
  });

  revalidatePath("/painel/ocorrencias");
  return { success: true };
}
