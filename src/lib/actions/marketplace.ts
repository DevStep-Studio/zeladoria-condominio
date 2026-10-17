"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  condominiums,
  customerFavorites,
  serviceDisputes,
  serviceMessages,
  serviceQuotes,
  serviceRequests,
  serviceReviews,
  users,
  vendors,
} from "@/db/schema";
import { requireCondo, requireSession } from "@/lib/auth";
import { logAudit, notify } from "@/lib/audit";
import { num, sequence, str } from "@/lib/utils";
import { customerAcceptProposalAndPay, customerConfirmServiceCompletion } from "@/lib/services/payments/payment-service";

/**
 * Criação de Chamado / Solicitação no Marketplace (Modo Sob Demanda ou Orçamento)
 */
export async function createMarketplaceRequestAction(payload: {
  vendorId?: number | null;
  mode: "on_demand" | "quote";
  category: string;
  title: string;
  description: string;
  urgency?: "agora" | "hoje" | "agendar" | "media" | "urgente";
  scheduledDate?: string;
  scheduledTimeSlot?: string;
  location?: string;
  attachments?: string[];
}) {
  try {
    const { session, condoId } = await requireCondo();

    if (!payload.title?.trim() || !payload.description?.trim()) {
      return { success: false, error: "Título e descrição do problema são obrigatórios." };
    }

    // Generate sequence code SRV-2026-XXXX
    const [countRow] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(serviceRequests)
      .where(eq(serviceRequests.condoId, condoId));

    const year = new Date().getFullYear();
    const seqNum = String((countRow?.n ?? 0) + 1).padStart(4, "0");
    const code = `SRV-${year}-${seqNum}`;

    const initialStatus = payload.mode === "on_demand" && !payload.vendorId
      ? "buscando_prestador"
      : "solicitado";

    const [req] = await db
      .insert(serviceRequests)
      .values({
        condoId,
        code,
        customerId: session.user.id,
        vendorId: payload.vendorId || null,
        mode: payload.mode,
        category: (payload.category || "servicos").toLowerCase(),
        title: payload.title.trim(),
        description: payload.description.trim(),
        urgency: payload.urgency || (payload.mode === "on_demand" ? "agora" : "hoje"),
        scheduledDate: payload.scheduledDate,
        scheduledTimeSlot: payload.scheduledTimeSlot,
        location: payload.location || "Minha Unidade",
        unitId: session.unitId ?? null,
        attachments: payload.attachments || [],
        status: initialStatus,
      })
      .returning();

    // Initial system message in chat
    const modeText = payload.mode === "on_demand" ? "Atendimento sob demanda / rápido" : "Solicitação de orçamento / projeto";
    await db.insert(serviceMessages).values({
      requestId: req.id,
      senderId: session.user.id,
      senderRole: "sistema",
      body: `Chamado registrado com sucesso (${modeText}). Código: ${code}. Aguardando confirmação do profissional.`,
    });

    // Notificar prestador se especificado
    if (payload.vendorId) {
      const [targetVendor] = await db
        .select({ userId: vendors.userId, name: vendors.name })
        .from(vendors)
        .where(eq(vendors.id, payload.vendorId))
        .limit(1);

      if (targetVendor?.userId) {
        await notify(
          condoId,
          [targetVendor.userId],
          `Novo chamado recebido: ${code}`,
          `${session.user.name} solicitou atendimento para "${payload.title}".`,
          `/prestador/chamados`
        );
      }
    }

    await logAudit({
      session,
      condoId,
      action: "criar",
      entity: "marketplace_request",
      entityId: req.id,
      summary: `Criou solicitação de serviço ${code} (${payload.mode}): ${payload.title}`,
    });

    revalidatePath("/painel/servicos");
    revalidatePath("/prestador/chamados");
    return { success: true, requestId: req.id, code };
  } catch (err: any) {
    console.error("Erro em createMarketplaceRequestAction:", err);
    return { success: false, error: err?.message || "Erro ao registrar solicitação no banco de dados." };
  }
}

/**
 * Morador aceita um orçamento específico entre várias propostas recebidas
 */
export async function acceptQuoteAction(quoteId: number) {
  try {
    const { session, condoId } = await requireCondo();
    const result = await customerAcceptProposalAndPay({
      quoteId,
      customerId: session.user.id,
      condoId,
    });

    const [quote] = await db
      .select()
      .from(serviceQuotes)
      .where(eq(serviceQuotes.id, quoteId))
      .limit(1);

    if (quote) {
      const [vendor] = await db
        .select({ userId: vendors.userId, name: vendors.name })
        .from(vendors)
        .where(eq(vendors.id, quote.vendorId))
        .limit(1);

      if (vendor?.userId) {
        await notify(
          condoId,
          [vendor.userId],
          `Orçamento aprovado pelo cliente!`,
          `Sua proposta de R$ ${(quote.totalCents / 100).toFixed(2)} foi aprovada sob proteção Zeladoria Protege.`,
          `/prestador/chamados`
        );
      }
    }

    revalidatePath("/painel/servicos");
    revalidatePath("/prestador/chamados");
    return { success: true, ...result };
  } catch (err: any) {
    console.error("Erro em acceptQuoteAction:", err);
    return { success: false, error: err?.message || "Erro ao aprovar proposta." };
  }
}

/**
 * Morador confirma que o serviço foi finalizado
 */
export async function confirmServiceCompletionAction(requestId: number) {
  const { session, condoId } = await requireCondo();

  const [req] = await db
    .select()
    .from(serviceRequests)
    .where(eq(serviceRequests.id, requestId))
    .limit(1);

  if (!req) return { success: false, error: "Chamado não encontrado." };
  if (req.customerId !== session.user.id && session.role !== "superadmin") {
    return { success: false, error: "Apenas o solicitante pode confirmar a conclusão." };
  }

  await db
    .update(serviceRequests)
    .set({
      status: "concluido",
      completedAt: req.completedAt || new Date(),
      updatedAt: new Date(),
    })
    .where(eq(serviceRequests.id, requestId));

  await db.insert(serviceMessages).values({
    requestId,
    senderId: session.user.id,
    senderRole: "morador",
    body: "O cliente confirmou a conclusão do atendimento com sucesso.",
  });

  revalidatePath("/painel/servicos");
  revalidatePath("/prestador/chamados");
  return { success: true };
}

/**
 * Avaliação Verificada Pós-Serviço com 4 critérios
 */
export async function createVerifiedReviewAction(payload: {
  requestId: number;
  vendorId: number;
  rating: number; // 1 a 5
  punctualityRating?: number;
  qualityRating?: number;
  communicationRating?: number;
  costBenefitRating?: number;
  comment?: string;
  photos?: string[];
}) {
  const { session, condoId } = await requireCondo();

  const [req] = await db
    .select()
    .from(serviceRequests)
    .where(eq(serviceRequests.id, payload.requestId))
    .limit(1);

  if (!req) return { success: false, error: "Chamado não encontrado." };
  if (req.customerId !== session.user.id && session.role !== "superadmin") {
    return { success: false, error: "Apenas quem contratou o serviço pode avaliar." };
  }

  // Verifica se já existe avaliação para esse serviço (máximo 1 oficial)
  const [existingReview] = await db
    .select()
    .from(serviceReviews)
    .where(eq(serviceReviews.requestId, payload.requestId))
    .limit(1);

  if (existingReview) {
    return { success: false, error: "Este serviço já foi avaliado anteriormente." };
  }

  const [review] = await db
    .insert(serviceReviews)
    .values({
      requestId: payload.requestId,
      vendorId: payload.vendorId,
      customerId: session.user.id,
      rating: Math.max(1, Math.min(5, payload.rating)),
      punctualityRating: payload.punctualityRating || payload.rating,
      qualityRating: payload.qualityRating || payload.rating,
      communicationRating: payload.communicationRating || payload.rating,
      costBenefitRating: payload.costBenefitRating || payload.rating,
      comment: payload.comment?.trim() || null,
      photos: payload.photos || [],
      isVerified: true,
    })
    .returning();

  // Recalcular média de avaliações do prestador
  const allVendorReviews = await db
    .select({ rating: serviceReviews.rating })
    .from(serviceReviews)
    .where(eq(serviceReviews.vendorId, payload.vendorId));

  const totalReviews = allVendorReviews.length;
  const avgRating = totalReviews > 0
    ? Math.round((allVendorReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 10) / 10
    : payload.rating;

  await db
    .update(vendors)
    .set({ rating: Math.round(avgRating) })
    .where(eq(vendors.id, payload.vendorId));

  // Notificar prestador sobre a nova avaliação
  const [vendor] = await db
    .select({ userId: vendors.userId, name: vendors.name })
    .from(vendors)
    .where(eq(vendors.id, payload.vendorId))
    .limit(1);

  if (vendor?.userId) {
    await notify(
      condoId,
      [vendor.userId],
      `Você recebeu uma nova avaliação: ${payload.rating} estrelas!`,
      `${session.user.name} avaliou o serviço com nota ${payload.rating}/5.`,
      `/prestador/avaliacoes`
    );
  }

  revalidatePath("/painel/servicos");
  revalidatePath("/prestador");
  return { success: true, reviewId: review.id };
}

/**
 * Enviar mensagem no Chat Contextual do Chamado
 */
export async function sendServiceMessageAction(requestId: number, body: string, attachmentUrl?: string) {
  const session = await requireSession();
  if (!body.trim()) return { success: false, error: "Mensagem vazia." };

  const [req] = await db
    .select()
    .from(serviceRequests)
    .where(eq(serviceRequests.id, requestId))
    .limit(1);

  if (!req) return { success: false, error: "Chamado não encontrado." };

  const senderRole = session.role === "prestador" ? "prestador" : "morador";

  const [msg] = await db
    .insert(serviceMessages)
    .values({
      requestId,
      senderId: session.user.id,
      senderRole,
      body: body.trim(),
      attachmentUrl: attachmentUrl || null,
    })
    .returning();

  revalidatePath("/painel/servicos");
  revalidatePath("/prestador/chamados");
  return { success: true, message: msg };
}

/**
 * Alternar Favorito
 */
export async function toggleCustomerFavoriteAction(vendorId: number) {
  const session = await requireSession();

  const [existing] = await db
    .select()
    .from(customerFavorites)
    .where(and(eq(customerFavorites.customerId, session.user.id), eq(customerFavorites.vendorId, vendorId)))
    .limit(1);

  if (existing) {
    await db
      .delete(customerFavorites)
      .where(eq(customerFavorites.id, existing.id));
    revalidatePath("/painel/servicos");
    return { success: true, isFavorite: false };
  } else {
    await db.insert(customerFavorites).values({
      customerId: session.user.id,
      vendorId,
    });
    revalidatePath("/painel/servicos");
    return { success: true, isFavorite: true };
  }
}

/**
 * Abrir Disputa / Ouvidoria de Atendimento
 */
export async function openDisputeAction(requestId: number, reason: string, description: string) {
  const { session, condoId } = await requireCondo();

  const [dispute] = await db
    .insert(serviceDisputes)
    .values({
      requestId,
      openedById: session.user.id,
      reason,
      description,
      status: "aberta",
    })
    .returning();

  await db
    .update(serviceRequests)
    .set({ status: "em_disputa", updatedAt: new Date() })
    .where(eq(serviceRequests.id, requestId));

  // Notificar sindicos e administradores
  await logAudit({
    session,
    condoId,
    action: "criar",
    entity: "service_dispute",
    entityId: dispute.id,
    summary: `Abriu disputa no serviço #${requestId}: ${reason}`,
  });

  revalidatePath("/painel/servicos");
  return { success: true, disputeId: dispute.id };
}

/**
 * Validação de conclusão do serviço pelo cliente ou síndico (Fase 4)
 * Aprova com avaliação (1 a 5 estrelas) ou solicita correção
 */
export async function validateServiceCompletionAction(payload: {
  requestId: number;
  approved: boolean;
  rating?: number;
  reviewComment?: string;
  correctionNotes?: string;
}) {
  const session = await requireSession();

  const [req] = await db
    .select()
    .from(serviceRequests)
    .where(eq(serviceRequests.id, payload.requestId))
    .limit(1);

  if (!req) return { success: false, error: "Chamado não encontrado." };

  // O morador solicitante ou síndico/admin do condomínio podem validar
  const isOwner = req.customerId === session.user.id;
  const isAdmin = session.role === "sindico" || session.role === "superadmin";
  if (!isOwner && !isAdmin) {
    return { success: false, error: "Não autorizado a validar este serviço." };
  }

  if (payload.approved) {
    // 1. Tenta confirmação financeira oficial se houver paymentOrder
    try {
      await customerConfirmServiceCompletion(req.id, req.customerId);
    } catch {
      // Atualização direta de conclusão caso seja serviço sem ordem de pagamento ou já avançado
      await db
        .update(serviceRequests)
        .set({
          status: "concluido",
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(serviceRequests.id, req.id));
    }

    // 2. Registra dados da validação
    const now = new Date();
    await db
      .update(serviceRequests)
      .set({
        status: "concluido",
        validatedAt: now,
        validatedById: session.user.id,
        updatedAt: now,
      })
      .where(eq(serviceRequests.id, req.id));

    // 3. Se forneceu avaliação (1 a 5 estrelas)
    if (payload.rating && req.vendorId) {
      const rating = Math.max(1, Math.min(5, Math.round(payload.rating)));
      await db
        .insert(serviceReviews)
        .values({
          requestId: req.id,
          vendorId: req.vendorId,
          customerId: req.customerId,
          rating,
          punctualityRating: rating,
          qualityRating: rating,
          communicationRating: rating,
          costBenefitRating: rating,
          comment: payload.reviewComment?.trim() || null,
          isVerified: true,
        })
        .onConflictDoNothing();

      // Recalcula média de avaliação do prestador
      const reviews = await db
        .select({ rating: serviceReviews.rating })
        .from(serviceReviews)
        .where(eq(serviceReviews.vendorId, req.vendorId));

      const avg = reviews.length > 0
        ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
        : rating;

      await db
        .update(vendors)
        .set({ rating: Math.round(avg) })
        .where(eq(vendors.id, req.vendorId));
    }

    // 4. Mensagem e notificação para o prestador
    await db.insert(serviceMessages).values({
      requestId: req.id,
      senderId: session.user.id,
      senderRole: "morador",
      body: `Serviço validado e concluído com sucesso pelo cliente! ${payload.rating ? `Avaliação: ${payload.rating} estrelas.` : ""}`,
    });

    if (req.vendorId) {
      const [vendor] = await db
        .select({ userId: vendors.userId })
        .from(vendors)
        .where(eq(vendors.id, req.vendorId))
        .limit(1);

      if (vendor?.userId) {
        await notify(
          req.condoId,
          [vendor.userId],
          `Serviço aprovado: ${req.title}`,
          `O morador aprovou a conclusão do serviço.${payload.rating ? ` Nota: ${payload.rating}/5.` : ""}`,
          `/prestador/chamados`
        );
      }
    }

    revalidatePath("/painel/servicos");
    revalidatePath("/prestador/chamados");
    return { success: true, status: "concluido" };
  } else {
    // Solicitação de correção / ajuste
    if (!payload.correctionNotes?.trim()) {
      return { success: false, error: "É obrigatório fornecer o motivo ou instruções de correção para o prestador." };
    }

    const now = new Date();
    await db
      .update(serviceRequests)
      .set({
        status: "correcao_solicitada",
        correctionNotes: payload.correctionNotes.trim(),
        updatedAt: now,
      })
      .where(eq(serviceRequests.id, req.id));

    await db.insert(serviceMessages).values({
      requestId: req.id,
      senderId: session.user.id,
      senderRole: "morador",
      body: `Solicitação de correção no serviço: "${payload.correctionNotes.trim()}". Por favor, faça os ajustes necessários.`,
    });

    if (req.vendorId) {
      const [vendor] = await db
        .select({ userId: vendors.userId })
        .from(vendors)
        .where(eq(vendors.id, req.vendorId))
        .limit(1);

      if (vendor?.userId) {
        await notify(
          req.condoId,
          [vendor.userId],
          `Ajuste solicitado no serviço: ${req.title}`,
          `O morador solicitou uma correção: ${payload.correctionNotes.trim()}`,
          `/prestador/chamados`
        );
      }
    }

    revalidatePath("/painel/servicos");
    revalidatePath("/prestador/chamados");
    return { success: true, status: "correcao_solicitada" };
  }
}

