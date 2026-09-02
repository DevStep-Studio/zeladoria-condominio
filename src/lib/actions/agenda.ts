"use server";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { agendaEvents, reservations, memberships } from "@/db/schema";
import { requireCondo, requireRole } from "@/lib/auth";
import { logAudit, notify } from "@/lib/audit";
import { ALL_STAFF } from "@/lib/rbac";
import { num, str } from "@/lib/utils";

async function condoResidentIds(condoId: number) {
  const rows = await db
    .select({ userId: memberships.userId })
    .from(memberships)
    .where(eq(memberships.condoId, condoId));
  return rows.map((r) => r.userId);
}

export async function createAgendaEventAction(formData: FormData) {
  const { session, condoId } = await requireRole([...ALL_STAFF, "porteiro", "morador"]);
  const title = str(formData, "title");
  const date = str(formData, "date");
  const startTime = str(formData, "startTime", "08:00");
  const endTime = str(formData, "endTime", "10:00");
  const category = str(formData, "category", "evento");
  const location = str(formData, "location", "Área Comum");
  const description = str(formData, "description");
  const responsible = str(formData, "responsible", session.user.name);
  const audienceScope = str(formData, "audienceScope", "todos");
  const reminder = str(formData, "reminder", "1d");
  const recurrence = str(formData, "recurrence", "nenhuma");
  const amenityId = num(formData, "amenityId") || null;

  if (!title || !date) {
    return { success: false, error: "Título e data são obrigatórios." };
  }

  // Conflict check if linked to an amenity
  if (amenityId) {
    const conflictingReservations = await db
      .select()
      .from(reservations)
      .where(
        and(
          eq(reservations.condoId, condoId),
          eq(reservations.amenityId, amenityId),
          eq(reservations.date, date),
          eq(reservations.status, "aprovada"),
        ),
      );

    const hasConflict = conflictingReservations.some(
      (r) =>
        (startTime >= r.startTime && startTime < r.endTime) ||
        (endTime > r.startTime && endTime <= r.endTime) ||
        (startTime <= r.startTime && endTime >= r.endTime),
    );

    if (hasConflict) {
      return {
        success: false,
        error: "O espaço selecionado já possui uma reserva confirmada neste horário.",
      };
    }
  }

  const [row] = await db
    .insert(agendaEvents)
    .values({
      condoId,
      title,
      description,
      category,
      date,
      startTime,
      endTime,
      location,
      responsible,
      audienceScope,
      reminder,
      recurrence,
      status: "agendado",
      amenityId,
      createdById: session.user.id,
    })
    .returning();

  await notify(
    condoId,
    await condoResidentIds(condoId),
    `Novo compromisso na Agenda: ${title}`,
    `Data: ${date} das ${startTime} às ${endTime} em ${location}`,
    "/painel/agenda",
  );

  await logAudit({
    session,
    condoId,
    action: "criar",
    entity: "agenda_event",
    entityId: row.id,
    summary: `Criou evento "${title}" para ${date} (${startTime}-${endTime})`,
  });

  revalidatePath("/painel/agenda");
  revalidatePath("/painel");
  return { success: true };
}

export async function deleteAgendaEventAction(formData: FormData) {
  const { session, condoId } = await requireRole(["superadmin", "sindico", "zelador"]);
  const id = num(formData, "id");
  if (!id) return { success: false, error: "ID não informado." };

  const [row] = await db
    .select()
    .from(agendaEvents)
    .where(and(eq(agendaEvents.id, id), eq(agendaEvents.condoId, condoId)))
    .limit(1);

  if (!row) return { success: false, error: "Evento não encontrado." };

  await db.delete(agendaEvents).where(eq(agendaEvents.id, id));

  await logAudit({
    session,
    condoId,
    action: "excluir",
    entity: "agenda_event",
    entityId: id,
    summary: `Excluiu evento "${row.title}" da agenda`,
    critical: true,
  });

  revalidatePath("/painel/agenda");
  revalidatePath("/painel");
  return { success: true };
}
