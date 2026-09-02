"use server";

import { revalidatePath } from "next/cache";
import { and, eq, not, sql } from "drizzle-orm";
import { db } from "@/db";
import { amenities, reservations, memberships } from "@/db/schema";
import { requireCondo, requireRole } from "@/lib/auth";
import { logAudit, notify } from "@/lib/audit";
import { ALL_STAFF } from "@/lib/rbac";
import { bool, num, str, token } from "@/lib/utils";

export async function createReservationAction(formData: FormData) {
  const { session, condoId } = await requireCondo();
  const amenityId = num(formData, "amenityId");
  const date = str(formData, "date");
  const startTime = str(formData, "startTime");
  const endTime = str(formData, "endTime");
  const guests = num(formData, "guests");
  const notes = str(formData, "notes");

  if (!amenityId || !date || !startTime || !endTime) {
    return { success: false, error: "Por favor, preencha todos os campos obrigatórios." };
  }

  const [amenity] = await db
    .select()
    .from(amenities)
    .where(and(eq(amenities.id, amenityId), eq(amenities.condoId, condoId)))
    .limit(1);

  if (!amenity || !amenity.active) {
    return { success: false, error: "Área comum não encontrada ou inativa." };
  }

  if (amenity.capacity && guests > amenity.capacity) {
    return {
      success: false,
      error: `A quantidade de convidados (${guests}) excede a capacidade máxima permitida (${amenity.capacity} pessoas).`,
    };
  }

  // Conflict check with existing active reservations
  const existing = await db
    .select()
    .from(reservations)
    .where(
      and(
        eq(reservations.condoId, condoId),
        eq(reservations.amenityId, amenityId),
        eq(reservations.date, date),
        not(eq(reservations.status, "cancelada")),
        not(eq(reservations.status, "rejeitada")),
      ),
    );

  const hasConflict = existing.some(
    (r) =>
      (startTime >= r.startTime && startTime < r.endTime) ||
      (endTime > r.startTime && endTime <= r.endTime) ||
      (startTime <= r.startTime && endTime >= r.endTime),
  );

  if (hasConflict) {
    return {
      success: false,
      error: "Já existe uma reserva agendada ou pendente para este espaço no horário selecionado.",
    };
  }

  const unitId = session.role === "morador" ? session.unitId : num(formData, "unitId") || session.unitId || null;
  const autoApprove = !amenity.requiresApproval;
  const status = autoApprove ? "aprovada" : "pendente";
  const qrToken = token(10);

  const [reservation] = await db
    .insert(reservations)
    .values({
      condoId,
      amenityId,
      unitId,
      userId: session.user.id,
      date,
      startTime,
      endTime,
      guests,
      status,
      qrToken,
      notes,
    })
    .returning();

  if (!autoApprove) {
    const sindicos = await db
      .select({ userId: memberships.userId })
      .from(memberships)
      .where(and(eq(memberships.condoId, condoId), eq(memberships.role, "sindico")));

    await notify(
      condoId,
      sindicos.map((s) => s.userId),
      `Nova solicitação de reserva: ${amenity.name}`,
      `Data: ${date} (${startTime}-${endTime}) por ${session.user.name}`,
      "/painel/reservas",
    );
  }

  await logAudit({
    session,
    condoId,
    action: "criar",
    entity: "reserva",
    entityId: reservation.id,
    summary: `Reservou ${amenity.name} para ${date} (${startTime}-${endTime})`,
  });

  revalidatePath("/painel/reservas");
  revalidatePath("/painel/agenda");
  revalidatePath("/painel");
  return { success: true };
}

export async function approveReservationAction(formData: FormData) {
  const { session, condoId } = await requireRole([...ALL_STAFF]);
  const id = num(formData, "id");
  if (!id) return { success: false, error: "ID inválido." };

  const [res] = await db
    .select()
    .from(reservations)
    .where(and(eq(reservations.id, id), eq(reservations.condoId, condoId)))
    .limit(1);

  if (!res) return { success: false, error: "Reserva não encontrada." };

  await db
    .update(reservations)
    .set({ status: "aprovada", rejectionReason: null })
    .where(eq(reservations.id, id));

  if (res.userId) {
    await notify(
      condoId,
      [res.userId],
      "Sua reserva foi Aprovada!",
      `A reserva para o dia ${res.date} (${res.startTime}-${res.endTime}) foi confirmada pela administração.`,
      "/painel/reservas",
    );
  }

  await logAudit({
    session,
    condoId,
    action: "aprovar",
    entity: "reserva",
    entityId: id,
    summary: `Aprovou reserva para ${res.date}`,
  });

  revalidatePath("/painel/reservas");
  revalidatePath("/painel/agenda");
  revalidatePath("/painel");
  return { success: true };
}

export async function rejectReservationAction(formData: FormData) {
  const { session, condoId } = await requireRole([...ALL_STAFF]);
  const id = num(formData, "id");
  const reason = str(formData, "reason", "Não especificado pela administração.");
  if (!id) return { success: false, error: "ID inválido." };

  const [res] = await db
    .select()
    .from(reservations)
    .where(and(eq(reservations.id, id), eq(reservations.condoId, condoId)))
    .limit(1);

  if (!res) return { success: false, error: "Reserva não encontrada." };

  await db
    .update(reservations)
    .set({ status: "rejeitada", rejectionReason: reason })
    .where(eq(reservations.id, id));

  if (res.userId) {
    await notify(
      condoId,
      [res.userId],
      "Sua reserva foi Recusada",
      `Motivo: ${reason}`,
      "/painel/reservas",
    );
  }

  await logAudit({
    session,
    condoId,
    action: "rejeitar",
    entity: "reserva",
    entityId: id,
    summary: `Rejeitou reserva para ${res.date}. Motivo: ${reason}`,
  });

  revalidatePath("/painel/reservas");
  revalidatePath("/painel/agenda");
  revalidatePath("/painel");
  return { success: true };
}

export async function cancelReservationAction(formData: FormData) {
  const { session, condoId } = await requireCondo();
  const id = num(formData, "id");
  if (!id) return { success: false, error: "ID inválido." };

  const [res] = await db
    .select()
    .from(reservations)
    .where(and(eq(reservations.id, id), eq(reservations.condoId, condoId)))
    .limit(1);

  if (!res) return { success: false, error: "Reserva não encontrada." };

  // If morador, must own the reservation
  if (session.role === "morador" && res.userId !== session.user.id) {
    return { success: false, error: "Permissão negada para cancelar esta reserva." };
  }

  await db
    .update(reservations)
    .set({ status: "cancelada" })
    .where(eq(reservations.id, id));

  await logAudit({
    session,
    condoId,
    action: "cancelar",
    entity: "reserva",
    entityId: id,
    summary: `Cancelou reserva para ${res.date}`,
  });

  revalidatePath("/painel/reservas");
  revalidatePath("/painel/agenda");
  revalidatePath("/painel");
  return { success: true };
}
