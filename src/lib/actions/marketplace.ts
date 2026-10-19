"use server";

import { revalidatePath } from "next/cache";
import { domainAction } from "@/lib/api/domain";
import type { DomainModels } from "@/lib/api/models";
import { requireCondo } from "@/lib/auth";
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
  const result = await domainAction<{ success: boolean; error?: string; requestId?: number; code?: string }>("/servicos", "POST", payload);
  if (result.success) {
    revalidatePath("/painel/servicos");
    revalidatePath("/prestador", "layout");
  }
  return result;
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

    await domainAction(`/servicos/orcamentos/${quoteId}/notificar`, "POST");

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
  const result = await domainAction<{ success: boolean; error?: string }>(`/servicos/${requestId}/conclusao/confirmar`, "POST");
  if (result.success) {
    revalidatePath("/painel/servicos");
    revalidatePath("/prestador/chamados");
  }
  return result;
}

/**
 * Avaliação Verificada Pós-Serviço com 4 critérios
 */
export async function createVerifiedReviewAction(payload: {
  requestId: number;
  vendorId: number;
  rating: number;
  punctualityRating?: number;
  qualityRating?: number;
  communicationRating?: number;
  costBenefitRating?: number;
  comment?: string;
  photos?: string[];
}) {
  const result = await domainAction<{ success: boolean; error?: string; reviewId?: number }>(`/servicos/${payload.requestId}/avaliacoes`, "POST", payload);
  if (result.success) {
    revalidatePath("/painel/servicos");
    revalidatePath("/prestador", "layout");
  }
  return result;
}

/**
 * Enviar mensagem no Chat Contextual do Chamado
 */
export async function sendServiceMessageAction(requestId: number, body: string, attachmentUrl?: string) {
  const result = await domainAction<{ success: boolean; error?: string; message?: DomainModels["serviceMessages"] }>(`/servicos/${requestId}/mensagens`, "POST", { body, attachmentUrl });
  if (result.success) {
    revalidatePath("/painel/servicos");
    revalidatePath("/prestador", "layout");
  }
  return result;
}

/**
 * Alternar Favorito
 */
export async function toggleCustomerFavoriteAction(vendorId: number) {
  const result = await domainAction<{ success: boolean; error?: string; isFavorite?: boolean }>(`/servicos/favoritos/${vendorId}`, "POST");
  if (result.success) {
    revalidatePath("/painel/servicos");
    revalidatePath("/prestador", "layout");
  }
  return result;
}

/**
 * Abrir Disputa / Ouvidoria de Atendimento
 */
export async function openDisputeAction(requestId: number, reason: string, description: string) {
  const result = await domainAction<{ success: boolean; error?: string; disputeId?: number }>(`/servicos/${requestId}/disputas`, "POST", { reason, description });
  if (result.success) {
    revalidatePath("/painel/servicos");
  }
  return result;
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
  if (payload.approved) {
    try {
      const { session } = await requireCondo();
      await customerConfirmServiceCompletion(payload.requestId, session.user.id);
    } catch {
      // Caso não possua ordem financeira ativa, prossegue com a validação direta na rota de domínio
    }
  }
  const result = await domainAction<{ success: boolean; error?: string; status?: string }>(`/servicos/${payload.requestId}/validacao`, "POST", payload);
  if (result.success) {
    revalidatePath("/painel/servicos");
    revalidatePath("/prestador/chamados");
  }
  return result;
}
