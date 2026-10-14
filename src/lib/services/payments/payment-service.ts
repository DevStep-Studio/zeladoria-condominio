import { and, desc, eq, sql } from "drizzle-orm";
import { createHash } from "node:crypto";
import { db } from "@/db";
import {
  contractAddendums,
  financialLedgerEntries,
  marketplaceSettings,
  paymentOrders,
  paymentRecipients,
  paymentWebhookEvents,
  serviceDisputes,
  serviceInspections,
  serviceMessages,
  serviceQuotes,
  serviceRequests,
  serviceWarrantyTickets,
  users,
  vendors,
} from "@/db/schema";
import { getPaymentGateway } from "./gateway-factory";
import { CreateChargeInput, SplitRule } from "./types";

/**
 * Busca configurações do marketplace (condomínio ou global)
 * Garante que a comissão NUNCA é hardcoded em 10%
 */
export async function getMarketplaceSettings(condoId?: number | null) {
  let settings: typeof marketplaceSettings.$inferSelect | undefined;

  if (condoId) {
    const [condoRow] = await db
      .select()
      .from(marketplaceSettings)
      .where(eq(marketplaceSettings.condoId, condoId))
      .limit(1);
    settings = condoRow;
  }

  if (!settings) {
    const [globalRow] = await db
      .select()
      .from(marketplaceSettings)
      .where(sql`${marketplaceSettings.condoId} IS NULL`)
      .limit(1);
    settings = globalRow;
  }

  return {
    commissionPercent: settings?.commissionPercent ?? 10,
    slotHoldMinutes: settings?.slotHoldMinutes ?? 10,
    inspectionFeeMaxCents: settings?.inspectionFeeMaxCents ?? 15000,
    disputeWindowHours: settings?.disputeWindowHours ?? 48,
    autoReleaseHours: settings?.autoReleaseHours ?? 72,
    processingFeePayer: settings?.processingFeePayer ?? "PROVIDER",
    estimatedPspFeePercent: Number(settings?.estimatedPspFeePercent ?? 3.5),
    visitCommissionPercent: settings?.visitCommissionPercent ?? 0,
  };
}

/**
 * Registra evento imutável no Ledger Contábil e Operacional interno
 */
export async function recordLedgerEntry(params: {
  condoId: number;
  requestId?: number | null;
  paymentOrderId?: number | null;
  eventType: string;
  amountCents: number;
  balanceType?: "credit" | "debit";
  entityType: "platform" | "vendor" | "customer" | "psp";
  referenceCode?: string;
  description?: string;
  metadata?: Record<string, any>;
}) {
  const [entry] = await db
    .insert(financialLedgerEntries)
    .values({
      condoId: params.condoId,
      requestId: params.requestId || null,
      paymentOrderId: params.paymentOrderId || null,
      eventType: params.eventType,
      amountCents: params.amountCents,
      balanceType: params.balanceType || "credit",
      entityType: params.entityType,
      referenceCode: params.referenceCode || null,
      description: params.description || null,
      metadata: params.metadata || {},
    })
    .returning();
  return entry;
}

/**
 * Garante que o prestador possua subconta / carteira de recebedor no PSP
 */
export async function ensurePaymentRecipient(vendorId: number) {
  const [existing] = await db
    .select()
    .from(paymentRecipients)
    .where(eq(paymentRecipients.vendorId, vendorId))
    .limit(1);

  if (existing) return existing;

  const [vendor] = await db.select().from(vendors).where(eq(vendors.id, vendorId)).limit(1);
  if (!vendor) throw new Error("Prestador não encontrado para vinculação de recebedor.");

  const gateway = getPaymentGateway("asaas");
  const recipientRes = await gateway.createRecipient({
    vendorId,
    name: vendor.companyName || vendor.name,
    email: vendor.email || `prestador_${vendorId}@zeladoria.com.br`,
    cpfCnpj: vendor.cnpj || "00000000000",
    phone: vendor.phone || "11999999999",
    accountType: vendor.providerType === "empresa" ? "company" : "individual",
    pixKey: vendor.whatsapp || vendor.phone || undefined,
  });

  const [created] = await db
    .insert(paymentRecipients)
    .values({
      vendorId,
      pspProvider: "asaas",
      pspAccountId: recipientRes.pspAccountId,
      pspApiKey: recipientRes.pspApiKey,
      status: recipientRes.status,
      accountType: vendor.providerType === "empresa" ? "company" : "individual",
    })
    .returning();

  return created;
}

/**
 * Prestador responde solicitação com Vistoria (Gratuita ou Paga)
 */
export async function providerRespondInspection(params: {
  requestId: number;
  vendorId: number;
  type: "gratuita" | "paga";
  priceCents: number;
  discountOnService?: boolean;
  estimatedDurationMinutes?: number;
  notes?: string;
  availableSlots: { date: string; time: string; label?: string }[];
}) {
  const [req] = await db
    .select()
    .from(serviceRequests)
    .where(eq(serviceRequests.id, params.requestId))
    .limit(1);

  if (!req) throw new Error("Chamado não encontrado.");

  // Se for paga, valida teto configurado
  const settings = await getMarketplaceSettings(req.condoId);
  const finalPriceCents = params.type === "gratuita" ? 0 : Math.min(params.priceCents, settings.inspectionFeeMaxCents);

  // Insere ou atualiza vistoria técnica
  const [inspection] = await db
    .insert(serviceInspections)
    .values({
      requestId: params.requestId,
      vendorId: params.vendorId,
      type: params.type,
      priceCents: finalPriceCents,
      discountOnService: params.type === "paga" ? !!params.discountOnService : false,
      estimatedDurationMinutes: params.estimatedDurationMinutes || 40,
      notes: params.notes || null,
      availableSlots: params.availableSlots,
      status: "pendente_escolha_morador",
    })
    .returning();

  // Atualiza chamado
  await db
    .update(serviceRequests)
    .set({
      vendorId: params.vendorId,
      inspectionId: inspection.id,
      status: "vistoria_proposta",
      updatedAt: new Date(),
    })
    .where(eq(serviceRequests.id, params.requestId));

  // Notificação no chat
  let typeText = params.type === "gratuita" ? "Vistoria Gratuita" : `Vistoria Técnica (R$ ${(finalPriceCents / 100).toFixed(2)})`;
  if (params.type === "paga" && params.discountOnService) {
    typeText += " [Descontada integralmente do serviço se aprovado]";
  }

  await db.insert(serviceMessages).values({
    requestId: params.requestId,
    senderId: req.customerId,
    senderRole: "sistema",
    body: `O prestador propôs ${typeText}. ${params.availableSlots.length} horários disponíveis informados. Escolha o melhor horário para prosseguir.`,
  });

  return inspection;
}

/**
 * Check-in da Vistoria pelo Prestador no Local
 */
export async function providerCheckInInspection(params: {
  inspectionId: number;
  vendorId: number;
}) {
  const [insp] = await db
    .select()
    .from(serviceInspections)
    .where(eq(serviceInspections.id, params.inspectionId))
    .limit(1);

  if (!insp) throw new Error("Vistoria não encontrada.");
  if (insp.vendorId !== params.vendorId) throw new Error("Não autorizado.");

  await db
    .update(serviceInspections)
    .set({
      providerArrivedAt: new Date(),
      status: "em_deslocamento",
      updatedAt: new Date(),
    })
    .where(eq(serviceInspections.id, insp.id));

  await db.insert(serviceMessages).values({
    requestId: insp.requestId,
    senderId: params.vendorId,
    senderRole: "prestador",
    body: `Check-in realizado! O prestador confirmou presença no condomínio para a realização da vistoria técnica.`,
  });

  return { success: true };
}

/**
 * Morador escolhe horário da vistoria:
 * - Se gratuita: confirma agenda diretamente sem checkout (status VISTORIA_AGENDADA)
 * - Se paga: aplica reserva temporária de 10 min e gera checkout com Order 'vistoria'
 */
export async function customerSelectInspectionSlot(params: {
  inspectionId: number;
  selectedSlot: { date: string; time: string };
  billingType?: "PIX" | "CREDIT_CARD";
}) {
  const [insp] = await db
    .select()
    .from(serviceInspections)
    .where(eq(serviceInspections.id, params.inspectionId))
    .limit(1);

  if (!insp) throw new Error("Vistoria não encontrada.");

  const [req] = await db
    .select()
    .from(serviceRequests)
    .where(eq(serviceRequests.id, insp.requestId))
    .limit(1);

  if (!req) throw new Error("Chamado vinculado não encontrado.");

  // 1. CASO VISTORIA GRATUITA: Nenhum checkout é criado!
  if (insp.type === "gratuita" || insp.priceCents === 0) {
    await db
      .update(serviceInspections)
      .set({
        selectedSlot: params.selectedSlot,
        status: "confirmada",
        updatedAt: new Date(),
      })
      .where(eq(serviceInspections.id, insp.id));

    await db
      .update(serviceRequests)
      .set({
        status: "VISTORIA_AGENDADA",
        scheduledDate: params.selectedSlot.date,
        scheduledTimeSlot: params.selectedSlot.time,
        updatedAt: new Date(),
      })
      .where(eq(serviceRequests.id, req.id));

    await db.insert(serviceMessages).values({
      requestId: req.id,
      senderId: req.customerId,
      senderRole: "morador",
      body: `Vistoria gratuita agendada para ${params.selectedSlot.date} às ${params.selectedSlot.time}.`,
    });

    return {
      checkoutRequired: false,
      status: "VISTORIA_AGENDADA",
      slot: params.selectedSlot,
    };
  }

  // 2. CASO VISTORIA PAGA: Reserva temporária de horário (Slot Hold) + Checkout
  const settings = await getMarketplaceSettings(req.condoId);
  const holdMinutes = settings.slotHoldMinutes;
  const holdExpiresAt = new Date(Date.now() + holdMinutes * 60 * 1000);

  // Busca dados do prestador e morador
  const [customerUser] = await db.select().from(users).where(eq(users.id, req.customerId)).limit(1);
  const [vendor] = await db.select().from(vendors).where(eq(vendors.id, insp.vendorId)).limit(1);

  // Código único para ordem de vistoria: PAY-VIS-YYYY-XXXX
  const seqNum = Math.floor(1000 + Math.random() * 9000);
  const orderCode = `PAY-VIS-${new Date().getFullYear()}-${seqNum}`;

  const commissionPercent = settings.commissionPercent;
  const platformFeeCents = Math.round((insp.priceCents * commissionPercent) / 100);
  const netVendorCents = insp.priceCents - platformFeeCents;

  // Garante recebedor PSP
  const recipient = await ensurePaymentRecipient(insp.vendorId);

  // Cria cobrança no gateway
  const gateway = getPaymentGateway("asaas");
  const chargeRes = await gateway.createCharge({
    orderCode,
    amountCents: insp.priceCents,
    purpose: "vistoria",
    customer: {
      name: customerUser?.name || "Morador",
      email: customerUser?.email || "morador@zeladoria.com.br",
      phone: customerUser?.phone || "11999999999",
    },
    billingType: params.billingType || "PIX",
    expirationSeconds: holdMinutes * 60,
    split: {
      recipientAccountId: recipient.pspAccountId,
      netVendorCents,
      platformFeeCents,
    },
  });

  // Salva payment_orders
  const [order] = await db
    .insert(paymentOrders)
    .values({
      code: orderCode,
      condoId: req.condoId,
      requestId: req.id,
      quoteId: null,
      customerId: req.customerId,
      vendorId: insp.vendorId,
      purpose: "vistoria",
      amountGrossCents: insp.priceCents,
      platformFeeCents,
      netVendorCents,
      commissionPercent,
      billingType: params.billingType || "PIX",
      pspProvider: "asaas",
      pspPaymentId: chargeRes.pspPaymentId,
      pspInvoiceUrl: chargeRes.invoiceUrl,
      pixQrCode: chargeRes.pixQrCode,
      pixCopiaECola: chargeRes.pixCopiaECola,
      status: "pending",
    })
    .returning();

  // Atualiza vistoria com o hold temporário de 10 min
  await db
    .update(serviceInspections)
    .set({
      selectedSlot: params.selectedSlot,
      holdExpiresAt,
      paymentOrderId: order.id,
      status: "aguardando_pagamento",
      updatedAt: new Date(),
    })
    .where(eq(serviceInspections.id, insp.id));

  await db
    .update(serviceRequests)
    .set({
      status: "aguardando_pagamento_vistoria",
      updatedAt: new Date(),
    })
    .where(eq(serviceRequests.id, req.id));

  return {
    checkoutRequired: true,
    orderCode,
    amountCents: insp.priceCents,
    vendorName: vendor?.name || "Prestador",
    slot: params.selectedSlot,
    holdExpiresAt,
    holdMinutes,
    pixCopiaECola: chargeRes.pixCopiaECola,
    pixQrCode: chargeRes.pixQrCode,
    invoiceUrl: chargeRes.invoiceUrl,
  };
}

/**
 * Prestador registra diagnóstico e fotos da vistoria
 */
export async function completeInspectionDiagnosis(params: {
  inspectionId: number;
  diagnosticReport: string;
  evidencePhotos?: string[];
}) {
  const [insp] = await db
    .select()
    .from(serviceInspections)
    .where(eq(serviceInspections.id, params.inspectionId))
    .limit(1);

  if (!insp) throw new Error("Vistoria não encontrada.");

  await db
    .update(serviceInspections)
    .set({
      diagnosticReport: params.diagnosticReport,
      evidencePhotos: params.evidencePhotos || [],
      status: "realizada",
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(serviceInspections.id, insp.id));

  await db
    .update(serviceRequests)
    .set({
      status: "diagnostico_registrado",
      updatedAt: new Date(),
    })
    .where(eq(serviceRequests.id, insp.requestId));

  await db.insert(serviceMessages).values({
    requestId: insp.requestId,
    senderId: insp.vendorId,
    senderRole: "prestador",
    body: `Diagnóstico da vistoria registrado: "${params.diagnosticReport}". O profissional está preparando a proposta digital do serviço.`,
  });

  return { success: true };
}

/**
 * Prestador envia proposta digital com Zeladoria Protege
 */
export async function sendDigitalProposal(params: {
  requestId: number;
  vendorId: number;
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
  // 1. Controle estrito de versionamento de propostas
  const existingQuotes = await db
    .select()
    .from(serviceQuotes)
    .where(and(eq(serviceQuotes.requestId, params.requestId), eq(serviceQuotes.vendorId, params.vendorId)))
    .orderBy(desc(serviceQuotes.version));

  const activeAccepted = existingQuotes.find((q) => q.status === "aceito" || q.status === "pago_protegido");
  if (activeAccepted) {
    throw new Error("Proposta já aceita pelo morador não pode ser modificada silenciosamente. Utilize um aditivo de escopo.");
  }

  const latestVersion = existingQuotes.length > 0 ? (existingQuotes[0].version || 1) : 0;
  const newVersion = latestVersion + 1;

  if (existingQuotes.length > 0) {
    await db
      .update(serviceQuotes)
      .set({ status: "substituida" })
      .where(and(eq(serviceQuotes.requestId, params.requestId), eq(serviceQuotes.status, "pendente")));
  }

  // 2. Desconto da vistoria técnica paga se aplicável
  let inspectionDiscountCents = 0;
  if (params.inspectionId) {
    const [insp] = await db
      .select()
      .from(serviceInspections)
      .where(eq(serviceInspections.id, params.inspectionId))
      .limit(1);

    if (insp && insp.discountOnService && insp.priceCents > 0) {
      inspectionDiscountCents = insp.priceCents;
    }
  }

  const laborCents = params.laborCents || 0;
  const materialsCents = params.materialsCents || 0;
  const otherCostsCents = params.otherCostsCents || 0;
  const discountCents = params.discountCents || 0;
  const grossSubtotal = laborCents + materialsCents + otherCostsCents - discountCents;
  const totalCents = Math.max(0, grossSubtotal - inspectionDiscountCents);
  const warrantyDays = params.warrantyDays ?? 90; // CDC mínimo legal

  // Gera contrato digital / hash de integridade imutável (Art. 26 CDC + Termos Zeladoria Protege)
  const contractString = `REQ_${params.requestId}_VEND_${params.vendorId}_V${newVersion}_VAL_${totalCents}_DISC_${inspectionDiscountCents}_WARR_${warrantyDays}_${Date.now()}`;
  const contractHash = createHash("sha256").update(contractString).digest("hex");

  const [quote] = await db
    .insert(serviceQuotes)
    .values({
      requestId: params.requestId,
      vendorId: params.vendorId,
      inspectionId: params.inspectionId || null,
      version: newVersion,
      title: params.title || "Proposta de Serviço Residencial",
      scopeDescription: params.scopeDescription || params.description,
      itemizedMaterials: params.itemizedMaterials || [],
      laborCents,
      materialsCents,
      otherCostsCents,
      discountCents,
      inspectionDiscountCents,
      totalCents,
      estimatedDays: params.estimatedDays,
      warrantyDays,
      contractHash,
      conditions: params.conditions || null,
      description: params.description,
      status: "pendente",
    })
    .returning();

  await db
    .update(serviceRequests)
    .set({
      status: "proposta_enviada",
      estimatedAmountCents: totalCents,
      updatedAt: new Date(),
    })
    .where(eq(serviceRequests.id, params.requestId));

  const discountMsg = inspectionDiscountCents > 0 ? ` (com crédito de -R$ ${(inspectionDiscountCents / 100).toFixed(2)} da vistoria)` : "";
  await db.insert(serviceMessages).values({
    requestId: params.requestId,
    senderId: params.vendorId,
    senderRole: "prestador",
    body: `Proposta digital v${newVersion} enviada: Total R$ ${(totalCents / 100).toFixed(2)}${discountMsg}. Mão de obra: R$ ${(laborCents / 100).toFixed(2)}, Materiais: R$ ${(materialsCents / 100).toFixed(2)}. Garantia informada: ${warrantyDays} dias com Zeladoria Protege.`,
  });

  return quote;
}

/**
 * Morador aceita proposta e gera Pagamento Online do Serviço (PAGAMENTO B)
 */
export async function customerAcceptProposalAndPay(params: {
  quoteId: number;
  billingType?: "PIX" | "CREDIT_CARD";
  userIp?: string;
}) {
  const [quote] = await db.select().from(serviceQuotes).where(eq(serviceQuotes.id, params.quoteId)).limit(1);
  if (!quote) throw new Error("Proposta não encontrada.");

  const [req] = await db.select().from(serviceRequests).where(eq(serviceRequests.id, quote.requestId)).limit(1);
  if (!req) throw new Error("Chamado não encontrado.");

  // Marca proposta como aceita com snapshot do IP e timestamp dos termos
  await db
    .update(serviceQuotes)
    .set({
      status: "aceito",
      termsAcceptedAt: new Date(),
      userIp: params.userIp || null,
    })
    .where(eq(serviceQuotes.id, quote.id));

  // Recusa propostas concorrentes do mesmo chamado
  await db
    .update(serviceQuotes)
    .set({ status: "recusado" })
    .where(and(eq(serviceQuotes.requestId, req.id), sql`${serviceQuotes.id} != ${quote.id}`));

  // Busca configurações de comissão
  const settings = await getMarketplaceSettings(req.condoId);
  const commissionPercent = settings.commissionPercent;
  const platformFeeCents = Math.round((quote.totalCents * commissionPercent) / 100);
  const netVendorCents = quote.totalCents - platformFeeCents;

  // Garante recebedor PSP para o prestador
  const recipient = await ensurePaymentRecipient(quote.vendorId);
  const [customerUser] = await db.select().from(users).where(eq(users.id, req.customerId)).limit(1);
  const [vendor] = await db.select().from(vendors).where(eq(vendors.id, quote.vendorId)).limit(1);

  // Gera código único da ordem do serviço principal: PAY-SRV-YYYY-XXXX
  const seqNum = Math.floor(1000 + Math.random() * 9000);
  const orderCode = `PAY-SRV-${new Date().getFullYear()}-${seqNum}`;

  const gateway = getPaymentGateway("asaas");
  const chargeRes = await gateway.createCharge({
    orderCode,
    amountCents: quote.totalCents,
    purpose: "servico",
    customer: {
      name: customerUser?.name || "Morador",
      email: customerUser?.email || "morador@zeladoria.com.br",
      phone: customerUser?.phone || "11999999999",
    },
    billingType: params.billingType || "PIX",
    split: {
      recipientAccountId: recipient.pspAccountId,
      netVendorCents,
      platformFeeCents,
    },
  });

  const [order] = await db
    .insert(paymentOrders)
    .values({
      code: orderCode,
      condoId: req.condoId,
      requestId: req.id,
      quoteId: quote.id,
      customerId: req.customerId,
      vendorId: quote.vendorId,
      purpose: "servico",
      amountGrossCents: quote.totalCents,
      platformFeeCents,
      netVendorCents,
      commissionPercent,
      billingType: params.billingType || "PIX",
      pspProvider: "asaas",
      pspPaymentId: chargeRes.pspPaymentId,
      pspInvoiceUrl: chargeRes.invoiceUrl,
      pixQrCode: chargeRes.pixQrCode,
      pixCopiaECola: chargeRes.pixCopiaECola,
      status: "pending",
    })
    .returning();

  await db
    .update(serviceRequests)
    .set({
      vendorId: quote.vendorId,
      status: "aguardando_pagamento_servico",
      finalAmountCents: quote.totalCents,
      platformFeeCents,
      commissionRatePercent: commissionPercent,
      paymentOrderId: order.id,
      updatedAt: new Date(),
    })
    .where(eq(serviceRequests.id, req.id));

  // Registra no Ledger contábil
  await recordLedgerEntry({
    condoId: req.condoId,
    requestId: req.id,
    paymentOrderId: order.id,
    eventType: "PAYMENT_CREATED",
    amountCents: quote.totalCents,
    balanceType: "credit",
    entityType: "customer",
    referenceCode: orderCode,
    description: `Cobrança emitida para serviço residencial (Proposta v${quote.version || 1})`,
    metadata: {
      quoteId: quote.id,
      vendorId: quote.vendorId,
      warrantyDays: quote.warrantyDays,
      contractHash: quote.contractHash,
    },
  });

  return {
    orderCode,
    totalCents: quote.totalCents,
    platformFeeCents,
    netVendorCents,
    vendorName: vendor?.name || "Prestador",
    warrantyDays: quote.warrantyDays,
    contractHash: quote.contractHash,
    pixCopiaECola: chargeRes.pixCopiaECola,
    pixQrCode: chargeRes.pixQrCode,
    invoiceUrl: chargeRes.invoiceUrl,
  };
}

/**
 * Processamento idempotente de Webhook do PSP
 */
export async function processPaymentWebhook(rawBody: string, headers: Record<string, string>) {
  const gateway = getPaymentGateway("asaas");

  if (!gateway.verifyWebhookSignature(headers, rawBody)) {
    throw new Error("Assinatura de webhook inválida.");
  }

  const event = gateway.parseWebhookEvent(rawBody);

  // 1. Verificação estrita de idempotência no banco
  const [existingEvent] = await db
    .select()
    .from(paymentWebhookEvents)
    .where(eq(paymentWebhookEvents.eventId, event.eventId))
    .limit(1);

  if (existingEvent) {
    return { success: true, duplicate: true, eventId: event.eventId };
  }

  // Registra evento no log
  await db.insert(paymentWebhookEvents).values({
    provider: "asaas",
    eventId: event.eventId,
    eventType: event.eventType,
    payload: event.rawPayload,
    status: "processed",
  });

  // 2. Localiza a ordem de pagamento correspondente
  const [order] = await db
    .select()
    .from(paymentOrders)
    .where(eq(paymentOrders.pspPaymentId, event.pspPaymentId))
    .limit(1);

  if (!order) {
    console.warn(`Ordem não encontrada para pspPaymentId ${event.pspPaymentId}`);
    return { success: true, orderFound: false };
  }

  // 3. Aplica regras de transição conforme o evento
  if (event.eventType === "PAYMENT_CONFIRMED") {
    if (order.purpose === "vistoria") {
      // PAGAMENTO A: Vistoria confirmada
      await db
        .update(paymentOrders)
        .set({ status: "paid", paidAt: new Date(), updatedAt: new Date() })
        .where(eq(paymentOrders.id, order.id));

      await db
        .update(serviceInspections)
        .set({ status: "confirmada", holdExpiresAt: null, updatedAt: new Date() })
        .where(eq(serviceInspections.paymentOrderId, order.id));

      await db
        .update(serviceRequests)
        .set({ status: "VISTORIA_CONFIRMADA", isPaid: true, updatedAt: new Date() })
        .where(eq(serviceRequests.id, order.requestId));

      await recordLedgerEntry({
        condoId: order.condoId,
        requestId: order.requestId,
        paymentOrderId: order.id,
        eventType: "PAYMENT_APPROVED",
        amountCents: order.amountGrossCents,
        balanceType: "credit",
        entityType: "customer",
        referenceCode: order.code,
        description: `Pagamento da vistoria técnica aprovado via ${order.billingType}`,
      });

      await db.insert(serviceMessages).values({
        requestId: order.requestId,
        senderId: order.customerId,
        senderRole: "sistema",
        body: `Pagamento da vistoria técnica confirmado com sucesso! Horário de visitação confirmado para o prestador.`,
      });
    } else if (order.purpose === "servico") {
      // PAGAMENTO B: Serviço protegido por Zeladoria Protege
      await db
        .update(paymentOrders)
        .set({
          status: "retained", // Valor em custódia/retenção do PSP
          paidAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(paymentOrders.id, order.id));

      await db
        .update(serviceRequests)
        .set({
          status: "SERVICO_PAGO_LIBERADO",
          isPaid: true,
          updatedAt: new Date(),
        })
        .where(eq(serviceRequests.id, order.requestId));

      // Registros contábeis no Ledger
      await recordLedgerEntry({
        condoId: order.condoId,
        requestId: order.requestId,
        paymentOrderId: order.id,
        eventType: "PAYMENT_APPROVED",
        amountCents: order.amountGrossCents,
        balanceType: "credit",
        entityType: "customer",
        referenceCode: order.code,
        description: `Pagamento do serviço aprovado e retido sob Zeladoria Protege`,
      });

      if (order.platformFeeCents > 0) {
        await recordLedgerEntry({
          condoId: order.condoId,
          requestId: order.requestId,
          paymentOrderId: order.id,
          eventType: "PLATFORM_FEE_RECORDED",
          amountCents: order.platformFeeCents,
          balanceType: "credit",
          entityType: "platform",
          referenceCode: `${order.code}-FEE`,
          description: `Comissão da plataforma Zeladoria (${order.commissionPercent}%)`,
        });
      }

      await recordLedgerEntry({
        condoId: order.condoId,
        requestId: order.requestId,
        paymentOrderId: order.id,
        eventType: "PROVIDER_RECEIVABLE_RECORDED",
        amountCents: order.netVendorCents,
        balanceType: "credit",
        entityType: "vendor",
        referenceCode: `${order.code}-NET`,
        description: `Recebível líquido do prestador sob proteção Zeladoria Protege`,
      });

      await db.insert(serviceMessages).values({
        requestId: order.requestId,
        senderId: order.customerId,
        senderRole: "sistema",
        body: `Pagamento do serviço aprovado e garantido pelo Zeladoria Protege! O prestador já pode executar o trabalho. O repasse será liberado após sua confirmação.`,
      });
    }
  } else if (event.eventType === "PAYMENT_REFUNDED") {
    await db
      .update(paymentOrders)
      .set({ status: "refunded", refundedAt: new Date(), updatedAt: new Date() })
      .where(eq(paymentOrders.id, order.id));

    await db
      .update(serviceRequests)
      .set({ status: "reembolsado", updatedAt: new Date() })
      .where(eq(serviceRequests.id, order.requestId));

    await recordLedgerEntry({
      condoId: order.condoId,
      requestId: order.requestId,
      paymentOrderId: order.id,
      eventType: "REFUND",
      amountCents: order.amountGrossCents,
      balanceType: "debit",
      entityType: "customer",
      referenceCode: `${order.code}-REFUND`,
      description: `Reembolso total processado via gateway`,
    });
  }

  return { success: true, processedOrder: order.code, eventType: event.eventType };
}

/**
 * Morador confirma "Tudo Certo" -> Libera repasse do split
 */
export async function customerConfirmServiceCompletion(requestId: number, customerId: number) {
  const [req] = await db.select().from(serviceRequests).where(eq(serviceRequests.id, requestId)).limit(1);
  if (!req) throw new Error("Chamado não encontrado.");
  if (req.customerId !== customerId) throw new Error("Não autorizado.");

  // Localiza a ordem de pagamento do serviço
  const [order] = await db
    .select()
    .from(paymentOrders)
    .where(and(eq(paymentOrders.requestId, requestId), eq(paymentOrders.purpose, "servico")))
    .limit(1);

  if (order) {
    await db
      .update(paymentOrders)
      .set({
        status: "released",
        releasedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(paymentOrders.id, order.id));

    await recordLedgerEntry({
      condoId: order.condoId,
      requestId: order.requestId,
      paymentOrderId: order.id,
      eventType: "PAYOUT",
      amountCents: order.netVendorCents,
      balanceType: "debit",
      entityType: "vendor",
      referenceCode: `${order.code}-PAYOUT`,
      description: `Repasse liberado ao prestador após confirmação "Tudo Certo!"`,
    });
  }

  await db
    .update(serviceRequests)
    .set({
      status: "concluido",
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(serviceRequests.id, requestId));

  await db.insert(serviceMessages).values({
    requestId,
    senderId: customerId,
    senderRole: "morador",
    body: "O cliente confirmou a conclusão do serviço (Tudo Certo!). Repasse financeiro liberado ao prestador pelo Zeladoria Protege.",
  });

  return { success: true };
}

/**
 * Morador contesta serviço -> Abre disputa e bloqueia repasse
 */
export async function customerOpenDispute(params: {
  requestId: number;
  customerId: number;
  reason: string;
  description: string;
}) {
  const [req] = await db.select().from(serviceRequests).where(eq(serviceRequests.id, params.requestId)).limit(1);
  if (!req) throw new Error("Chamado não encontrado.");
  if (req.customerId !== params.customerId) throw new Error("Não autorizado.");

  // Trava a ordem de pagamento
  await db
    .update(paymentOrders)
    .set({ status: "in_dispute", updatedAt: new Date() })
    .where(and(eq(paymentOrders.requestId, params.requestId), eq(paymentOrders.purpose, "servico")));

  const [dispute] = await db
    .insert(serviceDisputes)
    .values({
      requestId: params.requestId,
      openedById: params.customerId,
      reason: params.reason,
      description: params.description,
      status: "aberta",
    })
    .returning();

  await db
    .update(serviceRequests)
    .set({ status: "em_disputa", updatedAt: new Date() })
    .where(eq(serviceRequests.id, params.requestId));

  await recordLedgerEntry({
    condoId: req.condoId,
    requestId: req.id,
    eventType: "DISPUTE_HELD",
    amountCents: 0,
    balanceType: "debit",
    entityType: "platform",
    referenceCode: `DISPUTE-${dispute.id}`,
    description: `Repasse retido devido à contestação aberta: "${params.reason}"`,
  });

  await db.insert(serviceMessages).values({
    requestId: params.requestId,
    senderId: params.customerId,
    senderRole: "morador",
    body: `Contestação aberta pelo cliente: "${params.reason}". O repasse financeiro foi retido para mediação pelo condomínio através do Zeladoria Protege.`,
  });

  return dispute;
}

/**
 * Prestador cria aditivo de escopo (Cláusulas 41-42: nunca alterar preço silenciosamente)
 */
export async function providerCreateContractAddendum(params: {
  requestId: number;
  quoteId: number;
  vendorId: number;
  title: string;
  description: string;
  additionalAmountCents: number;
}) {
  const [req] = await db.select().from(serviceRequests).where(eq(serviceRequests.id, params.requestId)).limit(1);
  if (!req) throw new Error("Chamado não encontrado.");
  if (req.vendorId !== params.vendorId) throw new Error("Não autorizado.");

  const [addendum] = await db
    .insert(contractAddendums)
    .values({
      requestId: params.requestId,
      quoteId: params.quoteId,
      title: params.title,
      description: params.description,
      additionalAmountCents: params.additionalAmountCents,
      status: "proposto",
    })
    .returning();

  await db.insert(serviceMessages).values({
    requestId: params.requestId,
    senderId: params.vendorId,
    senderRole: "prestador",
    body: `Aditivo contratual de escopo proposto: "${params.title}" (+R$ ${(params.additionalAmountCents / 100).toFixed(2)}). Motivo: ${params.description}. O cliente precisa aprovar antes de prosseguir.`,
  });

  return addendum;
}

/**
 * Morador aceita aditivo de escopo e gera nova cobrança complementar
 */
export async function customerAcceptContractAddendum(params: {
  addendumId: number;
  customerId: number;
  billingType?: "PIX" | "CREDIT_CARD";
}) {
  const [addendum] = await db.select().from(contractAddendums).where(eq(contractAddendums.id, params.addendumId)).limit(1);
  if (!addendum) throw new Error("Aditivo não encontrado.");

  const [req] = await db.select().from(serviceRequests).where(eq(serviceRequests.id, addendum.requestId)).limit(1);
  if (!req || req.customerId !== params.customerId) throw new Error("Não autorizado.");

  const settings = await getMarketplaceSettings(req.condoId);
  const platformFeeCents = Math.round((addendum.additionalAmountCents * settings.commissionPercent) / 100);
  const netVendorCents = addendum.additionalAmountCents - platformFeeCents;
  const seqNum = Math.floor(1000 + Math.random() * 9000);
  const orderCode = `PAY-ADD-${new Date().getFullYear()}-${seqNum}`;

  const gateway = getPaymentGateway("asaas");
  const chargeRes = await gateway.createCharge({
    orderCode,
    amountCents: addendum.additionalAmountCents,
    purpose: "servico",
    customer: {
      name: "Morador",
      email: "morador@zeladoria.com.br",
    },
    billingType: params.billingType || "PIX",
  });

  const [order] = await db
    .insert(paymentOrders)
    .values({
      code: orderCode,
      condoId: req.condoId,
      requestId: req.id,
      quoteId: addendum.quoteId,
      customerId: req.customerId,
      vendorId: req.vendorId || 0,
      purpose: "servico",
      amountGrossCents: addendum.additionalAmountCents,
      platformFeeCents,
      netVendorCents,
      commissionPercent: settings.commissionPercent,
      billingType: params.billingType || "PIX",
      pspPaymentId: chargeRes.pspPaymentId,
      status: "pending",
    })
    .returning();

  await db
    .update(contractAddendums)
    .set({
      status: "aceito",
      paymentOrderId: order.id,
      updatedAt: new Date(),
    })
    .where(eq(contractAddendums.id, addendum.id));

  return { addendum, order, chargeRes };
}

/**
 * Morador solicita retorno em garantia (Cláusulas 74-76)
 */
export async function customerRequestWarranty(params: {
  requestId: number;
  customerId: number;
  description: string;
}) {
  const [req] = await db.select().from(serviceRequests).where(eq(serviceRequests.id, params.requestId)).limit(1);
  if (!req) throw new Error("Chamado não encontrado.");
  if (req.customerId !== params.customerId) throw new Error("Não autorizado.");

  const [quote] = await db
    .select()
    .from(serviceQuotes)
    .where(eq(serviceQuotes.requestId, req.id))
    .orderBy(desc(serviceQuotes.id))
    .limit(1);

  const [ticket] = await db
    .insert(serviceWarrantyTickets)
    .values({
      requestId: req.id,
      quoteId: quote?.id || 0,
      customerId: params.customerId,
      vendorId: req.vendorId || 0,
      description: params.description,
      status: "aberto",
    })
    .returning();

  await db.insert(serviceMessages).values({
    requestId: req.id,
    senderId: params.customerId,
    senderRole: "morador",
    body: `Solicitação de suporte em garantia aberta: "${params.description}". O prestador foi notificado para retorno técnico gratuito dentro da garantia contratual.`,
  });

  return ticket;
}
