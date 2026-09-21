"use server";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { tickets, ticketComments, vendors, memberships } from "@/db/schema";
import { requireCondo, requireRole } from "@/lib/auth";
import { logAudit, notify } from "@/lib/audit";
import { ALL_STAFF } from "@/lib/rbac";
import { num, sequence, str } from "@/lib/utils";
import { assistNote, suggestCategory, suggestPriority } from "@/lib/ai";

export async function createServiceRequestAction(formData: FormData) {
  const { session, condoId } = await requireCondo();
  const title = str(formData, "title");
  const description = str(formData, "description");
  if (!title || !description) {
    return { success: false, error: "Título e descrição são obrigatórios." };
  }

  const category = str(formData, "category") || suggestCategory(`${title} ${description}`) || "manutencao";
  const priority = str(formData, "priority") || suggestPriority(`${title} ${description}`) || "media";
  const location = str(formData, "location", "Unidade do Morador");
  const preferredTime = str(formData, "preferredTime");

  const requestedVendorId = num(formData, "vendorId") || null;
  let vendorId: number | null = null;
  let vendorName: string | null = null;
  if (requestedVendorId) {
    const [vendor] = await db
      .select({ id: vendors.id, name: vendors.name })
      .from(vendors)
      .where(and(eq(vendors.id, requestedVendorId), eq(vendors.condoId, condoId), eq(vendors.active, true)))
      .limit(1);
    if (vendor) {
      vendorId = vendor.id;
      vendorName = vendor.name;
    }
  }

  const [countRow] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(tickets)
    .where(eq(tickets.condoId, condoId));

  const code = sequence("SRV", Number(countRow?.n ?? 0) + 1);

  const [ticket] = await db
    .insert(tickets)
    .values({
      condoId,
      code,
      unitId: session.role === "morador" ? session.unitId : num(formData, "unitId") || session.unitId || null,
      title,
      description,
      category,
      priority,
      status: "solicitado",
      location,
      preferredTime,
      vendorId,
      aiPriority: priority,
      aiSummary: assistNote(priority, category),
      openedById: session.user.id,
      dueAt: new Date(Date.now() + (priority === "urgente" ? 1 : priority === "alta" ? 2 : 5) * 86400000),
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
    `Nova solicitação de serviço: ${ticket.code}`,
    `${title} (${category}) - Solicitado por ${session.user.name}${vendorName ? ` - Prestador: ${vendorName}` : ""}`,
    `/painel/servicos`,
  );

  await logAudit({
    session,
    condoId,
    action: "criar",
    entity: "servico",
    entityId: ticket.id,
    summary: `Solicitou serviço ${ticket.code}: ${title}`,
  });

  revalidatePath("/painel/servicos");
  revalidatePath("/painel");
  return { success: true };
}

export async function updateServiceStatusAction(formData: FormData) {
  const { session, condoId } = await requireRole([...ALL_STAFF, "porteiro"]);
  const id = num(formData, "id");
  if (!id) return { success: false, error: "ID inválido." };

  const [existing] = await db
    .select()
    .from(tickets)
    .where(and(eq(tickets.id, id), eq(tickets.condoId, condoId)))
    .limit(1);

  if (!existing) return { success: false, error: "Serviço não encontrado." };

  const status = str(formData, "status", existing.status);
  const vendorId = num(formData, "vendorId") || existing.vendorId;
  const assignedToId = num(formData, "assignedToId") || existing.assignedToId;
  const scheduledFor = str(formData, "scheduledFor") || existing.scheduledFor;
  const costCents = num(formData, "costCents") || existing.costCents;
  const report = str(formData, "report") || existing.report;
  const comment = str(formData, "comment");

  const isClosed = status === "concluido" || status === "cancelado";

  await db
    .update(tickets)
    .set({
      status,
      vendorId: vendorId || null,
      assignedToId: assignedToId || null,
      scheduledFor: scheduledFor || null,
      costCents,
      report: report || null,
      closedAt: isClosed ? new Date() : existing.closedAt,
    })
    .where(eq(tickets.id, id));

  if (comment) {
    await db.insert(ticketComments).values({
      ticketId: id,
      userId: session.user.id,
      body: comment,
      internal: false,
    });
  }

  if (existing.openedById) {
    await notify(
      condoId,
      [existing.openedById],
      `Atualização no serviço ${existing.code}`,
      `O status foi alterado para: ${status.replace("_", " ").toUpperCase()}`,
      "/painel/servicos",
    );
  }

  await logAudit({
    session,
    condoId,
    action: "atualizar",
    entity: "servico",
    entityId: id,
    summary: `Atualizou status do serviço ${existing.code} para ${status}`,
  });

  revalidatePath("/painel/servicos");
  revalidatePath("/painel");
  return { success: true };
}

export async function rateServiceAction(formData: FormData) {
  const { session, condoId } = await requireCondo();
  const id = num(formData, "id");
  const rating = num(formData, "rating");
  const ratingComment = str(formData, "ratingComment");

  if (!id || !rating) return { success: false, error: "Avaliação inválida." };

  const [existing] = await db
    .select()
    .from(tickets)
    .where(and(eq(tickets.id, id), eq(tickets.condoId, condoId)))
    .limit(1);

  if (!existing) return { success: false, error: "Serviço não encontrado." };

  // Only the creator or admin can rate
  if (session.role === "morador" && existing.openedById !== session.user.id) {
    return { success: false, error: "Apenas quem abriu o chamado pode avaliar." };
  }

  await db
    .update(tickets)
    .set({
      rating,
      ratingComment,
    })
    .where(eq(tickets.id, id));

  await logAudit({
    session,
    condoId,
    action: "avaliar",
    entity: "servico",
    entityId: id,
    summary: `Avaliou o serviço ${existing.code} com nota ${rating}/5`,
  });

  revalidatePath("/painel/servicos");
  return { success: true };
}
