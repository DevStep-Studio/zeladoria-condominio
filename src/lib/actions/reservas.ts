"use server";

import { revalidatePath } from "next/cache";
import { and, eq, gte, lte, not, sql } from "drizzle-orm";
import { db } from "@/db";
import { amenities, reservations, amenityBlocks, memberships } from "@/db/schema";
import { requireCondo, requireRole } from "@/lib/auth";
import { logAudit, notify } from "@/lib/audit";
import { ALL_STAFF } from "@/lib/rbac";
import { bool, cents, isoDate, num, str, token } from "@/lib/utils";

/** Helper: time string "HH:MM" to minutes since midnight */
function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** Helper: add minutes to "HH:MM" */
function addMinutesToTime(timeStr: string, minutes: number): string {
  const total = timeToMinutes(timeStr) + minutes;
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/* ==========================================================================
   1. CREATE RESERVATION (Morador / Staff)
   ========================================================================== */
export async function createReservationAction(formData: FormData) {
  const { session, condoId } = await requireCondo();
  const amenityId = num(formData, "amenityId");
  const date = str(formData, "date");
  const startTime = str(formData, "startTime");
  const endTime = str(formData, "endTime");
  const guests = num(formData, "guests", 0);
  const notes = str(formData, "notes");
  const rulesAccepted = bool(formData, "rulesAccepted");
  const guestListRaw = str(formData, "guestList");
  const guestList = guestListRaw
    ? guestListRaw
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  if (!amenityId || !date || !startTime || !endTime) {
    return { success: false, error: "Por favor, preencha todos os campos obrigatórios (espaço, data e horários)." };
  }

  const startMins = timeToMinutes(startTime);
  const endMins = timeToMinutes(endTime);
  if (endMins <= startMins) {
    return { success: false, error: "O horário de término deve ser posterior ao horário de início." };
  }

  // Load Amenity
  const [amenity] = await db
    .select()
    .from(amenities)
    .where(and(eq(amenities.id, amenityId), eq(amenities.condoId, condoId)))
    .limit(1);

  if (!amenity || !amenity.active) {
    return { success: false, error: "Este espaço comum não foi encontrado ou está inativo no condomínio." };
  }

  // 1. Check Capacity
  if (amenity.capacity && guests > amenity.capacity) {
    return {
      success: false,
      error: `A quantidade de pessoas (${guests}) excede a capacidade máxima permitida de ${amenity.capacity} pessoas.`,
    };
  }

  // 2. Check Date Constraints (Past dates & Advance limits)
  const todayStr = isoDate();
  if (date < todayStr) {
    return { success: false, error: "Não é permitido realizar reservas em datas passadas." };
  }

  const now = new Date();
  const reservationDateTime = new Date(`${date}T${startTime}:00`);
  const hoursUntil = (reservationDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  const minAdvanceHours = amenity.minAdvanceHours ?? 2;
  if (hoursUntil < minAdvanceHours && session.role === "morador") {
    return {
      success: false,
      error: `Este espaço exige antecedência mínima de ${minAdvanceHours} horas para agendamento.`,
    };
  }

  const maxAdvanceDays = amenity.maxAdvanceDays ?? 60;
  const daysUntil = (reservationDateTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (daysUntil > maxAdvanceDays && session.role === "morador") {
    return {
      success: false,
      error: `Este espaço permite reservas com no máximo ${maxAdvanceDays} dias de antecedência.`,
    };
  }

  // 3. Check Space Operating Hours
  const openTime = amenity.openTime || "08:00";
  const closeTime = amenity.closeTime || "22:00";
  if (startTime < openTime || endTime > closeTime) {
    return {
      success: false,
      error: `O horário selecionado está fora do horário de funcionamento do espaço (${openTime} às ${closeTime}).`,
    };
  }

  // 4. Check Blocked Periods (Maintenance / Cleanings)
  const activeBlocks = await db
    .select()
    .from(amenityBlocks)
    .where(
      and(
        eq(amenityBlocks.condoId, condoId),
        lte(amenityBlocks.startDate, date),
        gte(amenityBlocks.endDate, date),
      ),
    );

  const isBlocked = activeBlocks.some((b) => {
    if (b.amenityId !== null && b.amenityId !== amenityId) return false;
    if (!b.startTime || !b.endTime) return true; // full day block
    const bStart = timeToMinutes(b.startTime);
    const bEnd = timeToMinutes(b.endTime);
    return !(endMins <= bStart || startMins >= bEnd);
  });

  if (isBlocked) {
    return {
      success: false,
      error: "O espaço está bloqueado para manutenção ou limpeza neste período.",
    };
  }

  // 5. Check Unit Limit (e.g. max 2 reservations per unit per month/week)
  const unitId = session.role === "morador" ? session.unitId : num(formData, "unitId") || session.unitId || null;
  const limitPerUnit = amenity.limitPerUnit ?? 4;
  if (unitId && limitPerUnit > 0 && session.role === "morador") {
    const isWeek = amenity.limitInterval === "semana";
    // Count active reservations for this unit in the current month or week
    const existingUnitRes = await db
      .select({ id: reservations.id, date: reservations.date })
      .from(reservations)
      .where(
        and(
          eq(reservations.condoId, condoId),
          eq(reservations.amenityId, amenityId),
          eq(reservations.unitId, unitId),
          not(eq(reservations.status, "cancelada")),
          not(eq(reservations.status, "rejeitada")),
          gte(reservations.date, todayStr),
        ),
      );

    if (existingUnitRes.length >= limitPerUnit) {
      return {
        success: false,
        error: `Sua unidade já atingiu o limite de ${limitPerUnit} reservas ativas para este espaço (${isWeek ? "por semana" : "por mês"}).`,
      };
    }
  }

  // 6. Check Time Overlap / Double Booking (With Cleaning Buffer Interval)
  const bufferMinutes = amenity.intervalMinutes ?? 0;
  const existingReservations = await db
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

  const hasConflict = existingReservations.some((r) => {
    const rStart = timeToMinutes(r.startTime);
    const rEnd = timeToMinutes(r.endTime);
    const bufferedREnd = rEnd + bufferMinutes;
    const bufferedEndMins = endMins + bufferMinutes;

    // Overlap condition
    return !(endMins <= rStart || startMins >= bufferedREnd);
  });

  if (hasConflict) {
    return {
      success: false,
      error: "Este horário acabou de ser reservado ou conflita com o tempo de preparação/limpeza. Por favor, escolha outro horário.",
    };
  }

  // Calculate pricing
  const totalCents = amenity.feeCents || 0;
  const depositCents = amenity.depositCents || 0;
  const paymentStatus = totalCents > 0 ? "pending" : "not_required";

  // Determine Approval status
  const autoApprove = !amenity.requiresApproval;
  const status = autoApprove ? "aprovada" : "pendente";
  const qrToken = token(12);

  // Insert Reservation
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
      guestList,
      totalCents,
      depositCents,
      paymentStatus,
      status,
      rulesAccepted,
      qrToken,
      notes,
    })
    .returning();

  // Notifications
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
  } else {
    await notify(
      condoId,
      [session.user.id],
      "Reserva Confirmada!",
      `Sua reserva para ${amenity.name} em ${date} (${startTime}-${endTime}) foi confirmada com sucesso.`,
      "/painel/reservas",
    );
  }

  await logAudit({
    session,
    condoId,
    action: "criar",
    entity: "reserva",
    entityId: reservation.id,
    summary: `Reservou ${amenity.name} para ${date} (${startTime}-${endTime}) [Status: ${status}]`,
  });

  revalidatePath("/painel/reservas");
  revalidatePath("/painel/agenda");
  revalidatePath("/painel");
  return { success: true, id: reservation.id, status };
}

/* ==========================================================================
   2. APPROVE RESERVATION (Síndico / Staff)
   ========================================================================== */
export async function approveReservationAction(formData: FormData) {
  const { session, condoId } = await requireRole([...ALL_STAFF]);
  const id = num(formData, "id");
  if (!id) return { success: false, error: "ID de reserva inválido." };

  const [res] = await db
    .select()
    .from(reservations)
    .where(and(eq(reservations.id, id), eq(reservations.condoId, condoId)))
    .limit(1);

  if (!res) return { success: false, error: "Reserva não encontrada." };

  // Re-check conflict to prevent race conditions during approval
  const [amenity] = await db.select().from(amenities).where(eq(amenities.id, res.amenityId)).limit(1);
  const bufferMinutes = amenity?.intervalMinutes ?? 0;
  const startMins = timeToMinutes(res.startTime);
  const endMins = timeToMinutes(res.endTime);

  const conflicting = await db
    .select()
    .from(reservations)
    .where(
      and(
        eq(reservations.condoId, condoId),
        eq(reservations.amenityId, res.amenityId),
        eq(reservations.date, res.date),
        eq(reservations.status, "aprovada"),
        not(eq(reservations.id, id)),
      ),
    );

  const hasConflict = conflicting.some((c) => {
    const cStart = timeToMinutes(c.startTime);
    const cEnd = timeToMinutes(c.endTime) + bufferMinutes;
    return !(endMins <= cStart || startMins >= cEnd);
  });

  if (hasConflict) {
    return {
      success: false,
      error: "Não foi possível aprovar: já existe outra reserva aprovada e confirmada neste mesmo horário.",
    };
  }

  await db
    .update(reservations)
    .set({
      status: "aprovada",
      rejectionReason: null,
      approvedAt: new Date(),
      approvedById: session.user.id,
    })
    .where(eq(reservations.id, id));

  if (res.userId) {
    await notify(
      condoId,
      [res.userId],
      "Sua reserva foi Aprovada!",
      `A reserva de ${amenity?.name || "espaço"} para o dia ${res.date} (${res.startTime}-${res.endTime}) foi aprovada pela administração.`,
      "/painel/reservas",
    );
  }

  await logAudit({
    session,
    condoId,
    action: "aprovar",
    entity: "reserva",
    entityId: id,
    summary: `Aprovou reserva #${id} (${res.date} ${res.startTime}-${res.endTime})`,
  });

  revalidatePath("/painel/reservas");
  revalidatePath("/painel/agenda");
  revalidatePath("/painel");
  return { success: true };
}

/* ==========================================================================
   3. REJECT RESERVATION (Síndico / Staff)
   ========================================================================== */
export async function rejectReservationAction(formData: FormData) {
  const { session, condoId } = await requireRole([...ALL_STAFF]);
  const id = num(formData, "id");
  const reason = str(formData, "reason", "Horário indisponível ou regras do condomínio.");
  if (!id) return { success: false, error: "ID de reserva inválido." };

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
      "Sua solicitação de reserva foi Recusada",
      `Motivo informado pela administração: ${reason}`,
      "/painel/reservas",
    );
  }

  await logAudit({
    session,
    condoId,
    action: "rejeitar",
    entity: "reserva",
    entityId: id,
    summary: `Rejeitou reserva #${id}. Motivo: ${reason}`,
  });

  revalidatePath("/painel/reservas");
  revalidatePath("/painel/agenda");
  revalidatePath("/painel");
  return { success: true };
}

/* ==========================================================================
   4. CANCEL RESERVATION (Morador / Staff)
   ========================================================================== */
export async function cancelReservationAction(formData: FormData) {
  const { session, condoId } = await requireCondo();
  const id = num(formData, "id");
  const reason = str(formData, "reason", "Cancelamento solicitado pelo condômino.");
  if (!id) return { success: false, error: "ID de reserva inválido." };

  const [res] = await db
    .select()
    .from(reservations)
    .where(and(eq(reservations.id, id), eq(reservations.condoId, condoId)))
    .limit(1);

  if (!res) return { success: false, error: "Reserva não encontrada." };

  // If Morador, verify ownership and cancellation deadline
  if (session.role === "morador") {
    if (res.userId !== session.user.id) {
      return { success: false, error: "Permissão negada: você só pode cancelar suas próprias reservas." };
    }

    const [amenity] = await db.select().from(amenities).where(eq(amenities.id, res.amenityId)).limit(1);
    const deadlineHours = amenity?.cancellationDeadlineHours ?? 24;

    const resDateTime = new Date(`${res.date}T${res.startTime}:00`);
    const hoursRemaining = (resDateTime.getTime() - Date.now()) / (1000 * 60 * 60);

    if (hoursRemaining < deadlineHours && resDateTime > new Date()) {
      return {
        success: false,
        error: `Cancelamento não permitido: o prazo limite para este espaço é de até ${deadlineHours}h de antecedência.`,
      };
    }
  }

  await db
    .update(reservations)
    .set({
      status: "cancelada",
      cancellationReason: reason,
      cancelledAt: new Date(),
    })
    .where(eq(reservations.id, id));

  await logAudit({
    session,
    condoId,
    action: "cancelar",
    entity: "reserva",
    entityId: id,
    summary: `Cancelou reserva #${id} (${res.date})`,
  });

  revalidatePath("/painel/reservas");
  revalidatePath("/painel/agenda");
  revalidatePath("/painel");
  return { success: true };
}

/* ==========================================================================
   5. SAVE / EDIT AMENITY SPACE (Síndico / Superadmin)
   ========================================================================== */
export async function saveAmenityAction(formData: FormData) {
  const { session, condoId } = await requireRole(["superadmin", "sindico"]);
  const id = num(formData, "id");
  const name = str(formData, "name");
  if (!name) return { success: false, error: "O nome do espaço é obrigatório." };

  const category = str(formData, "category", "outro");
  const description = str(formData, "description");
  const capacity = num(formData, "capacity", 20);
  const pricingType = str(formData, "pricingType", "gratis");
  const feeCents = pricingType === "gratis" ? 0 : cents(formData, "feeCents");
  const depositCents = cents(formData, "depositCents");
  const reservationModel = str(formData, "reservationModel", "horario_livre");
  const slotDurationMinutes = num(formData, "slotDurationMinutes", 60);
  const openTime = str(formData, "openTime", "08:00");
  const closeTime = str(formData, "closeTime", "22:00");
  const intervalMinutes = num(formData, "intervalMinutes", 30);
  const minAdvanceHours = num(formData, "minAdvanceHours", 2);
  const maxAdvanceDays = num(formData, "maxAdvanceDays", 60);
  const limitPerUnit = num(formData, "limitPerUnit", 2);
  const limitInterval = str(formData, "limitInterval", "mes");
  const cancellationDeadlineHours = num(formData, "cancellationDeadlineHours", 24);
  const requestGuestList = bool(formData, "requestGuestList");
  const requiresApproval = bool(formData, "requiresApproval");
  const rules = str(formData, "rules");

  // Images list
  const coverImage = str(formData, "coverImage") || "/amenities/salao-festas.jpg";
  const galleryRaw = str(formData, "gallery");
  const images = [coverImage, ...galleryRaw.split("\n").map((s) => s.trim()).filter((s) => s && s !== coverImage)];

  // Features list
  const featuresRaw = str(formData, "features");
  const features = featuresRaw
    ? featuresRaw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
    : [];

  const values = {
    condoId,
    name,
    category,
    description: description || null,
    capacity,
    pricingType,
    feeCents,
    depositCents,
    reservationModel,
    slotDurationMinutes,
    openTime,
    closeTime,
    intervalMinutes,
    minAdvanceHours,
    maxAdvanceDays,
    limitPerUnit,
    limitInterval,
    cancellationDeadlineHours,
    requestGuestList,
    requiresApproval,
    rules: rules || null,
    images,
    features,
    active: true,
  };

  if (id) {
    await db
      .update(amenities)
      .set(values)
      .where(and(eq(amenities.id, id), eq(amenities.condoId, condoId)));

    await logAudit({
      session,
      condoId,
      action: "atualizar",
      entity: "espaco",
      entityId: id,
      summary: `Atualizou configurações do espaço "${name}"`,
    });
  } else {
    const [row] = await db.insert(amenities).values(values).returning();
    await logAudit({
      session,
      condoId,
      action: "criar",
      entity: "espaco",
      entityId: row.id,
      summary: `Cadastrou novo espaço "${name}"`,
    });
  }

  revalidatePath("/painel/reservas");
  revalidatePath("/painel/agenda");
  revalidatePath("/painel");
  return { success: true };
}

/* ==========================================================================
   6. DELETE / TOGGLE AMENITY (Síndico / Superadmin)
   ========================================================================== */
export async function toggleAmenityActiveAction(formData: FormData) {
  const { session, condoId } = await requireRole(["superadmin", "sindico"]);
  const id = num(formData, "id");
  if (!id) return { success: false, error: "ID inválido." };

  const [row] = await db
    .select()
    .from(amenities)
    .where(and(eq(amenities.id, id), eq(amenities.condoId, condoId)))
    .limit(1);

  if (!row) return { success: false, error: "Espaço não encontrado." };

  const newActive = !row.active;
  await db
    .update(amenities)
    .set({ active: newActive })
    .where(eq(amenities.id, id));

  await logAudit({
    session,
    condoId,
    action: newActive ? "ativar" : "desativar",
    entity: "espaco",
    entityId: id,
    summary: `${newActive ? "Ativou" : "Desativou"} espaço "${row.name}"`,
  });

  revalidatePath("/painel/reservas");
  return { success: true, active: newActive };
}

export async function deleteAmenityAction(formData: FormData) {
  const { session, condoId } = await requireRole(["superadmin", "sindico"]);
  const id = num(formData, "id");
  if (!id) return { success: false, error: "ID inválido." };

  // Check if there are active reservations
  const activeRes = await db
    .select({ id: reservations.id })
    .from(reservations)
    .where(
      and(
        eq(reservations.amenityId, id),
        eq(reservations.condoId, condoId),
        not(eq(reservations.status, "cancelada")),
        gte(reservations.date, isoDate()),
      ),
    );

  if (activeRes.length > 0) {
    // Soft delete to preserve historical integrity
    await db.update(amenities).set({ active: false }).where(eq(amenities.id, id));
    return {
      success: true,
      message: `O espaço possui ${activeRes.length} reservas futuras e foi desativado em vez de excluído para manter o histórico.`,
    };
  }

  await db.delete(amenities).where(and(eq(amenities.id, id), eq(amenities.condoId, condoId)));
  await logAudit({
    session,
    condoId,
    action: "excluir",
    entity: "espaco",
    entityId: id,
    summary: `Excluiu espaço #${id}`,
  });

  revalidatePath("/painel/reservas");
  return { success: true };
}

/* ==========================================================================
   7. CREATE / DELETE BLOCKED PERIOD (Síndico / Staff)
   ========================================================================== */
export async function createBlockAction(formData: FormData) {
  const { session, condoId } = await requireRole([...ALL_STAFF]);
  const amenityId = num(formData, "amenityId") || null;
  const startDate = str(formData, "startDate");
  const endDate = str(formData, "endDate", startDate);
  const startTime = str(formData, "startTime") || null;
  const endTime = str(formData, "endTime") || null;
  const recurrentDay = str(formData, "recurrentDay") || null;
  const reason = str(formData, "reason", "Manutenção preventiva / Limpeza programada");

  if (!startDate) {
    return { success: false, error: "A data de início do bloqueio é obrigatória." };
  }

  const [block] = await db
    .insert(amenityBlocks)
    .values({
      condoId,
      amenityId,
      startDate,
      endDate,
      startTime,
      endTime,
      recurrentDay,
      reason,
      createdById: session.user.id,
    })
    .returning();

  await logAudit({
    session,
    condoId,
    action: "bloquear",
    entity: "bloqueio_espaco",
    entityId: block.id,
    summary: `Bloqueou período (${startDate} a ${endDate}): ${reason}`,
  });

  revalidatePath("/painel/reservas");
  return { success: true, id: block.id };
}

export async function deleteBlockAction(formData: FormData) {
  const { session, condoId } = await requireRole([...ALL_STAFF]);
  const id = num(formData, "id");
  if (!id) return { success: false, error: "ID inválido." };

  await db
    .delete(amenityBlocks)
    .where(and(eq(amenityBlocks.id, id), eq(amenityBlocks.condoId, condoId)));

  await logAudit({
    session,
    condoId,
    action: "desbloquear",
    entity: "bloqueio_espaco",
    entityId: id,
    summary: `Removeu bloqueio #${id}`,
  });

  revalidatePath("/painel/reservas");
  return { success: true };
}
