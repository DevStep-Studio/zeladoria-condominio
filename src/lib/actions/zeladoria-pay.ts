"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  marketplaceSettings,
  paymentOrders,
  paymentRecipients,
  serviceInspections,
  serviceRequests,
} from "@/db/schema";
import { requireCondo, requireProvider, requireRole, requireSession } from "@/lib/auth";
import {
  completeInspectionDiagnosis,
  customerAcceptContractAddendum,
  customerAcceptProposalAndPay,
  customerConfirmServiceCompletion,
  customerOpenDispute,
  customerRequestWarranty,
  customerSelectInspectionSlot,
  getMarketplaceSettings,
  processPaymentWebhook,
  providerCheckInInspection,
  providerCreateContractAddendum,
  providerRespondInspection,
  sendDigitalProposal,
} from "@/lib/services/payments/payment-service";

/**
 * 1. Prestador responde chamado ofertando vistoria (Gratuita ou Paga)
 */
export async function providerRespondInspectionAction(payload: {
  requestId: number;
  type: "gratuita" | "paga";
  priceCents: number;
  discountOnService?: boolean;
  estimatedDurationMinutes?: number;
  notes?: string;
  availableSlots: { date: string; time: string; label?: string }[];
}) {
  try {
    const { vendor } = await requireProvider();
    if (!vendor) return { success: false, error: "Perfil de prestador não encontrado." };

    if (!payload.availableSlots || payload.availableSlots.length === 0) {
      return { success: false, error: "Informe ao menos um horário disponível para a vistoria." };
    }

    const inspection = await providerRespondInspection({
      requestId: payload.requestId,
      vendorId: vendor.id,
      type: payload.type,
      priceCents: payload.priceCents,
      discountOnService: payload.discountOnService,
      estimatedDurationMinutes: payload.estimatedDurationMinutes,
      notes: payload.notes,
      availableSlots: payload.availableSlots,
    });

    revalidatePath("/prestador");
    revalidatePath("/prestador/chamados");
    revalidatePath("/painel/servicos");
    return { success: true, inspectionId: inspection.id };
  } catch (err: any) {
    console.error("Erro em providerRespondInspectionAction:", err);
    return { success: false, error: err?.message || "Erro ao responder vistoria." };
  }
}

/**
 * 2. Morador seleciona horário da vistoria:
 * - Se gratuita: confirma agenda sem checkout
 * - Se paga: reserva temporária de 10 min + checkout Pix/Cartão
 */
export async function customerSelectInspectionSlotAction(payload: {
  inspectionId: number;
  selectedSlot: { date: string; time: string };
  billingType?: "PIX" | "CREDIT_CARD";
}) {
  try {
    await requireCondo();
    const result = await customerSelectInspectionSlot({
      inspectionId: payload.inspectionId,
      selectedSlot: payload.selectedSlot,
      billingType: payload.billingType,
    });

    revalidatePath("/painel/servicos");
    revalidatePath("/prestador/chamados");
    return { success: true, ...result };
  } catch (err: any) {
    console.error("Erro em customerSelectInspectionSlotAction:", err);
    return { success: false, error: err?.message || "Erro ao selecionar horário da vistoria." };
  }
}

/**
 * 2.1 Prestador realiza check-in no local da vistoria
 */
export async function providerCheckInInspectionAction(inspectionId: number) {
  try {
    const { vendor } = await requireProvider();
    if (!vendor) return { success: false, error: "Não autorizado." };

    const result = await providerCheckInInspection({ inspectionId, vendorId: vendor.id });
    revalidatePath("/prestador/chamados");
    revalidatePath("/painel/servicos");
    return result;
  } catch (err: any) {
    console.error("Erro em providerCheckInInspectionAction:", err);
    return { success: false, error: err?.message || "Erro ao registrar check-in." };
  }
}

/**
 * 3. Prestador registra diagnóstico e fotos da vistoria realizada
 */
export async function completeInspectionDiagnosisAction(payload: {
  inspectionId: number;
  diagnosticReport: string;
  evidencePhotos?: string[];
}) {
  try {
    const { vendor } = await requireProvider();
    if (!vendor) return { success: false, error: "Não autorizado." };

    if (!payload.diagnosticReport?.trim()) {
      return { success: false, error: "O laudo/diagnóstico técnico é obrigatório." };
    }

    const result = await completeInspectionDiagnosis(payload);

    revalidatePath("/prestador/chamados");
    revalidatePath("/painel/servicos");
    return result;
  } catch (err: any) {
    console.error("Erro em completeInspectionDiagnosisAction:", err);
    return { success: false, error: err?.message || "Erro ao registrar diagnóstico." };
  }
}

/**
 * 4. Prestador envia proposta digital (Mão de obra + Peças + Garantia)
 */
export async function sendDigitalProposalAction(payload: {
  requestId: number;
  inspectionId?: number;
  title?: string;
  scopeDescription?: string;
  itemizedMaterials?: { name: string; amountCents: number; quantity?: number }[];
  laborCents: number;
  materialsCents: number;
  otherCostsCents?: number;
  discountCents?: number;
  estimatedDays: number;
  warrantyDays?: number;
  conditions?: string;
  description: string;
}) {
  try {
    const { vendor } = await requireProvider();
    if (!vendor) return { success: false, error: "Não autorizado." };

    if (!payload.description?.trim()) {
      return { success: false, error: "A descrição do serviço proposto é obrigatória." };
    }

    const quote = await sendDigitalProposal({
      ...payload,
      vendorId: vendor.id,
    });

    revalidatePath("/prestador/chamados");
    revalidatePath("/painel/servicos");
    return { success: true, quoteId: quote.id };
  } catch (err: any) {
    console.error("Erro em sendDigitalProposalAction:", err);
    return { success: false, error: err?.message || "Erro ao enviar proposta digital." };
  }
}

/**
 * 5. Morador aceita proposta e gera Pagamento B (Zeladoria Protege com split)
 */
export async function customerAcceptProposalAction(payload: {
  quoteId: number;
  billingType?: "PIX" | "CREDIT_CARD";
}) {
  try {
    await requireCondo();
    const result = await customerAcceptProposalAndPay(payload);

    revalidatePath("/painel/servicos");
    revalidatePath("/prestador/chamados");
    return { success: true, ...result };
  } catch (err: any) {
    console.error("Erro em customerAcceptProposalAction:", err);
    return { success: false, error: err?.message || "Erro ao aceitar proposta." };
  }
}

/**
 * 6. Morador confirma conclusão (Tudo Certo!) -> Libera repasse do split
 */
export async function customerConfirmCompletionAction(requestId: number) {
  try {
    const { session } = await requireCondo();
    const result = await customerConfirmServiceCompletion(requestId, session.user.id);

    revalidatePath("/painel/servicos");
    revalidatePath("/prestador/chamados");
    revalidatePath("/prestador/ganhos");
    return result;
  } catch (err: any) {
    console.error("Erro em customerConfirmCompletionAction:", err);
    return { success: false, error: err?.message || "Erro ao confirmar conclusão." };
  }
}

/**
 * 7. Morador contesta serviço -> Abre disputa e bloqueia repasse
 */
export async function customerOpenDisputeAction(payload: {
  requestId: number;
  reason: string;
  description: string;
}) {
  try {
    const { session } = await requireCondo();
    const result = await customerOpenDispute({
      requestId: payload.requestId,
      customerId: session.user.id,
      reason: payload.reason,
      description: payload.description,
    });

    revalidatePath("/painel/servicos");
    revalidatePath("/prestador/chamados");
    return { success: true, disputeId: result.id };
  } catch (err: any) {
    console.error("Erro em customerOpenDisputeAction:", err);
    return { success: false, error: err?.message || "Erro ao abrir contestação." };
  }
}

/**
 * 8. Simular pagamento imediato de uma ordem (para testes, demo e sandbox)
 */
export async function simulateWebhookPaymentAction(orderCode: string) {
  try {
    const [order] = await db.select().from(paymentOrders).where(eq(paymentOrders.code, orderCode)).limit(1);
    if (!order) return { success: false, error: "Ordem de pagamento não encontrada." };

    const fakePayload = {
      id: `sim_evt_${Date.now()}`,
      event: "PAYMENT_CONFIRMED",
      payment: {
        id: order.pspPaymentId || `pay_sim_${order.id}`,
        value: order.amountGrossCents / 100,
        netValue: order.netVendorCents / 100,
      },
    };

    const result = await processPaymentWebhook(JSON.stringify(fakePayload), {
      "asaas-access-token": "zeladoria_dev_token",
    });

    revalidatePath("/painel/servicos");
    revalidatePath("/prestador/chamados");
    revalidatePath("/prestador/ganhos");
    return { success: true, result };
  } catch (err: any) {
    console.error("Erro ao simular pagamento:", err);
    return { success: false, error: err?.message || "Erro ao processar simulação de pagamento." };
  }
}

/**
 * 9. Admin atualiza configurações do marketplace (Comissão %, prazos, teto de vistoria)
 */
export async function adminUpdateMarketplaceSettingsAction(payload: {
  commissionPercent: number;
  slotHoldMinutes?: number;
  inspectionFeeMaxCents?: number;
  disputeWindowHours?: number;
  autoReleaseHours?: number;
}) {
  try {
    const { session, condoId } = await requireRole(["sindico", "superadmin"]);

    const [existing] = await db
      .select()
      .from(marketplaceSettings)
      .where(eq(marketplaceSettings.condoId, condoId))
      .limit(1);

    if (existing) {
      await db
        .update(marketplaceSettings)
        .set({
          commissionPercent: payload.commissionPercent,
          ...(payload.slotHoldMinutes !== undefined && { slotHoldMinutes: payload.slotHoldMinutes }),
          ...(payload.inspectionFeeMaxCents !== undefined && { inspectionFeeMaxCents: payload.inspectionFeeMaxCents }),
          ...(payload.disputeWindowHours !== undefined && { disputeWindowHours: payload.disputeWindowHours }),
          ...(payload.autoReleaseHours !== undefined && { autoReleaseHours: payload.autoReleaseHours }),
          updatedAt: new Date(),
        })
        .where(eq(marketplaceSettings.id, existing.id));
    } else {
      await db.insert(marketplaceSettings).values({
        condoId,
        commissionPercent: payload.commissionPercent,
        slotHoldMinutes: payload.slotHoldMinutes || 10,
        inspectionFeeMaxCents: payload.inspectionFeeMaxCents || 15000,
        disputeWindowHours: payload.disputeWindowHours || 48,
        autoReleaseHours: payload.autoReleaseHours || 72,
      });
    }

    revalidatePath("/painel/admin");
    revalidatePath("/painel/servicos");
    return { success: true };
  } catch (err: any) {
    console.error("Erro em adminUpdateMarketplaceSettingsAction:", err);
    return { success: false, error: err?.message || "Erro ao salvar configurações." };
  }
}

/**
 * 10. Obter configurações ativas do marketplace
 */
export async function getMarketplaceSettingsAction() {
  try {
    const session = await requireSession();
    const condoId = session.condo?.id ?? null;
    const settings = await getMarketplaceSettings(condoId);
    return { success: true, settings };
  } catch {
    return {
      success: true,
      settings: {
        commissionPercent: 10,
        slotHoldMinutes: 10,
        inspectionFeeMaxCents: 15000,
        disputeWindowHours: 48,
        autoReleaseHours: 72,
        processingFeePayer: "PROVIDER",
        estimatedPspFeePercent: 3.5,
        visitCommissionPercent: 0,
      },
    };
  }
}

/**
 * 11. Prestador propõe aditivo contratual de escopo (Cláusulas 41-42)
 */
export async function providerCreateContractAddendumAction(payload: {
  requestId: number;
  quoteId: number;
  title: string;
  description: string;
  additionalAmountCents: number;
}) {
  try {
    const { vendor } = await requireProvider();
    if (!vendor) return { success: false, error: "Não autorizado." };

    if (!payload.title?.trim() || !payload.description?.trim()) {
      return { success: false, error: "Título e descrição do aditivo são obrigatórios." };
    }
    if (payload.additionalAmountCents <= 0) {
      return { success: false, error: "O valor adicional deve ser superior a zero." };
    }

    const addendum = await providerCreateContractAddendum({
      ...payload,
      vendorId: vendor.id,
    });

    revalidatePath("/prestador/chamados");
    revalidatePath("/painel/servicos");
    return { success: true, addendumId: addendum.id };
  } catch (err: any) {
    console.error("Erro em providerCreateContractAddendumAction:", err);
    return { success: false, error: err?.message || "Erro ao propor aditivo de escopo." };
  }
}

/**
 * 12. Morador aceita aditivo de escopo e gera cobrança complementar
 */
export async function customerAcceptContractAddendumAction(payload: {
  addendumId: number;
  billingType?: "PIX" | "CREDIT_CARD";
}) {
  try {
    const { session } = await requireCondo();
    const result = await customerAcceptContractAddendum({
      addendumId: payload.addendumId,
      customerId: session.user.id,
      billingType: payload.billingType,
    });

    revalidatePath("/painel/servicos");
    revalidatePath("/prestador/chamados");
    return { success: true, ...result };
  } catch (err: any) {
    console.error("Erro em customerAcceptContractAddendumAction:", err);
    return { success: false, error: err?.message || "Erro ao aprovar aditivo contratual." };
  }
}

/**
 * 13. Morador solicita retorno em garantia pós-serviço (Cláusulas 74-76)
 */
export async function customerRequestWarrantyAction(payload: {
  requestId: number;
  description: string;
}) {
  try {
    const { session } = await requireCondo();
    if (!payload.description?.trim()) {
      return { success: false, error: "Informe os detalhes do problema em garantia." };
    }

    const ticket = await customerRequestWarranty({
      requestId: payload.requestId,
      customerId: session.user.id,
      description: payload.description,
    });

    revalidatePath("/painel/servicos");
    revalidatePath("/prestador/chamados");
    return { success: true, ticketId: ticket.id };
  } catch (err: any) {
    console.error("Erro em customerRequestWarrantyAction:", err);
    return { success: false, error: err?.message || "Erro ao abrir solicitação de garantia." };
  }
}
